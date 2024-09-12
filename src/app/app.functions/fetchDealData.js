const hubspot = require('@hubspot/api-client');

exports.main = async (context = {}) => {
  const { hs_object_id } = context.propertiesToSend;
  const hubspotClient = new hubspot.Client({ accessToken: context.secrets.privateappkey });

  try {
    const dealData = await fetchDealData(hubspotClient, hs_object_id);
    return dealData;
  } catch (error) {
    console.error('Error fetching deal data:', error);
    throw error;
  }
};

async function fetchDealData(hubspotClient, dealId) {
  try {
    const deal = await hubspotClient.crm.deals.basicApi.getById(dealId, ['associations.company', 'associations.contact']);
    return deal;
  } catch (error) {
    console.error('Error in fetchDealData:', error);
    throw error;
  }
}
