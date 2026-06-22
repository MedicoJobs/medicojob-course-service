const crypto = require('node:crypto');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  ScanCommand,
} = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.DYNAMODB_COURSES_TABLE || 'medicojobs-courses';
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

class QueryResult {
  constructor(itemsPromise) {
    this.itemsPromise = itemsPromise;
  }

  sort(sortSpec = {}) {
    return this.itemsPromise.then((items) => {
      const [[field, direction] = []] = Object.entries(sortSpec);

      if (!field) {
        return items;
      }

      return [...items].sort((left, right) => {
        const leftValue = left[field] || '';
        const rightValue = right[field] || '';

        if (leftValue === rightValue) {
          return 0;
        }

        return leftValue > rightValue ? direction : -direction;
      });
    });
  }
}

class Course {
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

  static find() {
    return new QueryResult(scanAll());
  }

  static async findById(id) {
    if (!id) {
      return null;
    }

    const response = await client.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    }));

    return normalize(response.Item);
  }
}

module.exports = Course;
