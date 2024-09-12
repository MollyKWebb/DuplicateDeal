const axios = require('axios');

const QUERY = `
  query data($id: String!) {
    CRM {
      deal(uniqueIdentifier: $id) {
        associations {
          company_collection {
            total
          }
          contact_collection {
            total
          }
        }
      }
    }
  }
`;

exports.main = async (context = {}) => {
  const { hs_object_id } = context.propertiesToSend;
  const token = process.env['privateappkey'];

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
    associations: responseBody.data.CRM.deal.associations,
    lineItemCount: lineItemsResponse.data.total,
  };
};
