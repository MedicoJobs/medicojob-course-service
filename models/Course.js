const crypto = require('node:crypto');
const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { getDynamoClient, clone, normalize, scanAll } = require('../utils/dynamo');

const TABLE_NAME = process.env.DYNAMODB_COURSES_TABLE || 'medicojobs-courses';
const client = getDynamoClient();

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
    return new QueryResult(scanAll(client, TABLE_NAME));
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
