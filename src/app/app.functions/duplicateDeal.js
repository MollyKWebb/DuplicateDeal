const axios = require('axios');

exports.main = async (context = {}) => {
  const { hs_object_id } = context.propertiesToSend;
  const { associations, newDealName } = context.parameters;
  const token = process.env['appsecret'];

  const properties = await fetchProperties(token, hs_object_id);
  const filteredProperties = filterProperties({ ...properties, dealname: newDealName });
  const deal = await createDeal(token, filteredProperties);
  await setAssociations(token, deal, associations);
  await createLineItems(token, hs_object_id, deal.id);

  return deal;
};

const fetchProperties = async (token, id) => {
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
  return responseBody.data.CRM.deal;
};

const createDeal = async (token, properties) => {
  try {
    const response = await axios.post(
      'https://api.hubapi.com/crm/v3/objects/deals',
      { properties: properties },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return response.data;
  } catch (err) {
    if (err.response && err.response.status === 401) {
      throw new Error('You do not have permission to duplicate this deal');
    } else {
      throw err;
    }
  }
};

const setAssociations = async (token, deal, associations) => {
  const formattedAssociations = transformAssociations(associations, deal.id);

  const associationsPromises = [];

  if (formattedAssociations.company_collection) {
    associationsPromises.push(
      updateAssociations(
        token,
        formattedAssociations.company_collection,
        '0-3',
        '0-2',
      ),
    );
  }

  if (formattedAssociations.contact_collection) {
    associationsPromises.push(
      updateAssociations(
        token,
        formattedAssociations.contact_collection,
        '0-3',
        '0-1',
      ),
    );
  }

  return Promise.all(associationsPromises);
};

const updateAssociations = async (token, associations, fromObjectType, toObjectType) => {
  return axios.post(
    `https://api.hubapi.com/crm/v4/associations/${fromObjectType}/${toObjectType}/batch/create`,
    { inputs: associations },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

const transformAssociations = (associationsGQL, id) => {
  let result = {
    company_collection: [],
    contact_collection: [],
  };

  Object.keys(associationsGQL).forEach((key) => {
    associationsGQL[key].items.forEach((item) => {
      result[key].push({
        from: { id },
        to: { id: item.hs_object_id.toString() },
        types: [
          {
            associationCategory: 'HUBSPOT_DEFINED',
            associationTypeId: ASSOCIATION_TYPE_IDS[key],
          },
        ],
      });
    });
  });

  return result;
};

const createLineItems = async (token, originalDealId, newDealId) => {
  const lineItems = await fetchLineItems(token, originalDealId);
  const createPromises = lineItems.map(lineItem => createLineItem(token, lineItem, newDealId));
  return Promise.all(createPromises);
};

const fetchLineItems = async (token, dealId) => {
  const response = await axios.get(
    `https://api.hubapi.com/crm/v3/objects/deals/${dealId}/associations/line_items`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.data.results;
};

const createLineItem = async (token, lineItem, dealId) => {
  const lineItemProperties = await fetchLineItemProperties(token, lineItem.id);
  const newLineItem = await axios.post(
    'https://api.hubapi.com/crm/v3/objects/line_items',
    { properties: lineItemProperties },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    },
  );
  
  await associateLineItemToDeal(token, newLineItem.data.id, dealId);
  return newLineItem.data;
};

const fetchLineItemProperties = async (token, lineItemId) => {
  const response = await axios.get(
    `https://api.hubapi.com/crm/v3/objects/line_items/${lineItemId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
  return response.data.properties;
};

const associateLineItemToDeal = async (token, lineItemId, dealId) => {
  return axios.put(
    `https://api.hubapi.com/crm/v3/objects/line_items/${lineItemId}/associations/deals/${dealId}/5`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
};

const filterProperties = (obj) => {
  return Object.entries(obj).reduce((accumulator, [key, value]) => {
    if (key !== 'hs_object_id' && value !== null) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
};

const ASSOCIATION_TYPE_IDS = {
  company_collection: 5,
  contact_collection: 3,
};

const QUERY = `query data($id: String!) {
  CRM {
    deal(uniqueIdentifier: "id", uniqueIdentifierValue: $id) {
      amount
      closedate
      createdate
      dealname
      dealstage
      hubspot_owner_id
      pipeline
    }
  }
}`;
