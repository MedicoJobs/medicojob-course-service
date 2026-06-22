const crypto = require('node:crypto');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { getDynamoClient, clone, normalize, scanAll } = require('../utils/dynamo');

const TABLE_NAME = process.env.DYNAMODB_ENROLLMENTS_TABLE || 'medicojobs-enrollments';
const client = getDynamoClient();

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
    const enrollments = await scanAll(client, TABLE_NAME);
    
    return enrollments.find(enrollment => {
      return Object.entries(query).every(([key, value]) => {
        return enrollment[key] === value;
      });
    }) || null;
  }
}

module.exports = Enrollment;
