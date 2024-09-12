// Importing necessary components from React and HubSpot UI Extensions
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  DescriptionList,
  DescriptionListItem,
  Input,
  Link,
  LoadingSpinner,
  Text,
  Flex,
  hubspot,
  type Context,
  type ServerlessFuncRunner,
} from '@hubspot/ui-extensions';

// ... (keep existing imports)

// Update interfaces for deal data
export interface DealData {
  associations: {
    company_collection: Association;
    contact_collection: Association;
  };
  lineItemCount: number;
}

const Extension = ({ runServerless, context }: ExtensionProps) => {
  const [loading, setLoading] = useState(true);
  const [dealData, setDealData] = useState<DealData>();
  const [newDealName, setNewDealName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    runServerless({
      name: 'fetchDealData',
      propertiesToSend: ['hs_object_id'],
    }).then((resp) => {
      setLoading(false);
      if (resp.status === 'SUCCESS') {
        setDealData(resp.response as DealData);
      } else {
        setError(resp.message);
      }
    });
  }, [runServerless]);

  const duplicateDeal = () => {
    setLoading(true);
    runServerless({
      name: 'duplicateDeal',
      propertiesToSend: ['hs_object_id'],
      parameters: { newDealName },
    }).then((resp) => {
      setLoading(false);
      if (resp.status === 'SUCCESS') {
        const deal = resp.response;
        setUrl(
          `https://app.hubspot.com/contacts/${context.portal.id}/deal/${deal.id}`
        );
      } else {
        setError(resp.message);
      }
    });
  };

  // ... (keep loading and error handling)

  if (dealData && url === '') {
    return (
      <>
        <Flex direction={'column'} gap={'lg'}>
          <Text variant="microcopy">
            Duplicate a deal along with its properties, associated companies and contacts, and line items.
          </Text>
          <Flex direction={'column'} gap={'sm'}>
            <Text format={{ fontWeight: 'bold' }}>
              Enter a name for the new deal:
            </Text>
            <Input
              label=""
              name="newDealName"
              onInput={(v) => setNewDealName(v)}
              required={true}
            />
            <Text format={{ fontWeight: 'bold' }}>
              Associations and line items to be copied:
            </Text>
            <DescriptionList direction="row">
              <DescriptionListItem label={'Companies'}>
                {dealData.associations.company_collection.total}
              </DescriptionListItem>
              <DescriptionListItem label={'Contacts'}>
                {dealData.associations.contact_collection.total}
              </DescriptionListItem>
              <DescriptionListItem label={'Line Items'}>
                {dealData.lineItemCount}
              </DescriptionListItem>
            </DescriptionList>
            <Flex direction={'row'} justify={'end'}>
              <Button
                onClick={duplicateDeal}
                disabled={newDealName === ''}
                variant="primary"
              >
                Duplicate Deal
              </Button>
            </Flex>
          </Flex>
        </Flex>
      </>
    );
  }

  // ... (keep URL display logic)
};
  // If a URL has been generated, show it
  return (
    <>
      <Link href={url}>{url.toString()}</Link>
    </>
  );
};
