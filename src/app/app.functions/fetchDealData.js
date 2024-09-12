const axios = require('axios');

exports.main = async (context = {}) => {
  const { hs_object_id } = context.propertiesToSend;
  const token = process.env['PRIVATE_APP_ACCESS_TOKEN'];

  return await fetchDealData(token, hs_object_id);
};

const fetchDealData = async (token, id) => {
  const requestBody = {
    operationName: 'data',
    query: QUERY,
    variables: { id },
  };

  const response = await axios.post('https://api.hubapi.com/collector/graphql', JSON.stringify(requestBody), {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const responseBody = response.data;

  const lineItemsResponse = await axios.get(
    `https://api.hubapi.com/crm/v3/objects/deals/${id}/associations/line_items`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return {
    ...responseBody.data.CRM
