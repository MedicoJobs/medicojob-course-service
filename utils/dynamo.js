const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';

const getDynamoClient = () => {
  return DynamoDBDocumentClient.from(new DynamoDBClient({ region: AWS_REGION }), {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  });
};

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

const scanAll = async (client, tableName) => {
  const items = [];
  let ExclusiveStartKey;

  do {
    const response = await client.send(new ScanCommand({
      TableName: tableName,
      ExclusiveStartKey,
    }));

    items.push(...(response.Items || []));
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items.map(normalize);
};

module.exports = {
  getDynamoClient,
  clone,
  normalize,
  scanAll
};
