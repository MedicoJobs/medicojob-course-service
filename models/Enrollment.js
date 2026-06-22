const crypto = require('node:crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.DYNAMODB_ENROLLMENTS_TABLE || 'medicojobs-enrollments';
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({ region: AWS_REGION }), {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const clone = (value) => structuredClone(value);

const normalize = (item) => {
  if (!item) {
    return null;
  }

  return {
    ...item,
    id: item.id,
    _id: item.id,
  };
};

const scanAll = async () => {
  const items = [];
  let ExclusiveStartKey;

  do {
    const response = await client.send(new ScanCommand({
      TableName: TABLE_NAME,
      ExclusiveStartKey,
    }));

    items.push(...(response.Items || []));
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items.map(normalize);
};

class Enrollment {
  constructor(data = {}) {
    Object.assign(this, clone(data));
    this.id = this.id || this._id || crypto.randomUUID();
    this._id = this.id;
  }

  async save() {
    const now = new Date().toISOString();
    const item = {
      ...clone(this),
      id: this.id,
      completedAt: this.completedAt || now,
      createdAt: this.createdAt || now,
      updatedAt: now,
    };

    delete item._id;

    await client.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }));

    Object.assign(this, normalize(item));
    return this;
  }

  toJSON() {
    return normalize(clone(this));
  }

  static async findOne(query = {}) {
    const enrollments = await scanAll();
    
    return enrollments.find(enrollment => {
      return Object.entries(query).every(([key, value]) => {
        return enrollment[key] === value;
      });
    }) || null;
  }
}

module.exports = Enrollment;
