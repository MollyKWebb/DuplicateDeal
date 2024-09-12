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
} from '@hubspot/ui-extensions';

// Define the Association interface
interface Association {
  total: number;
}

// Update interfaces for deal data
interface DealData {
  associations: {
    company_collection: Association;
    contact_collection: Association;
  };
  lineItemCount: number;
}

interface ExtensionProps {
  runServerless: any; // Replace 'any' with the correct type if available
  context: any; // Replace 'any' with the correct type if available
}

const Extension: React.FC<ExtensionProps> = ({ runServerless, context }) => {
  const [loading, setLoading] = useState(true);
  const [dealData, setDealData] = useState<DealData | null>(null);
  const [newDealName, setNewDealName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDealData();
  }, []);

  const fetchDealData = async () => {
    try {
      const resp = await runServerless({
        name: 'fetchDealData',
        propertiesToSend: ['hs_object_id'],
      });
      setLoading(false);
      if (resp.status === 'SUCCESS' && resp.response) {
        setDealData(resp.response as DealData);
      } else {
        setError(resp.message || 'Failed to fetch deal data');
      }
    } catch (err) {
      setLoading(false);
      setError('An error occurred while fetching deal data');
    }
  };

  const duplicateDeal = async () => {
    setLoading(true);
    try {
      const resp = await runServerless({
        name: 'duplicateDeal',
        propertiesToSend: ['hs_object_id'],
        parameters: { newDealName },
      });
      setLoading(false);
      if (resp.status === 'SUCCESS' && resp.response) {
        const deal = resp.response;
        setUrl(`https://app.hubspot.com/contacts/${context.portal.id}/deal/${deal.id}`);
      } else {
        setError(resp.message || 'Failed to duplicate deal');
      }
    } catch (err) {
      setLoading(false);
      setError('An error occurred while duplicating the deal');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <Alert title="Error" variant="error">{error}</Alert>;
  }

  if (dealData && url === '') {
    return (
      <Flex direction="column" gap="lg">
        <Text variant="microcopy">
          Duplicate a deal along with its properties, associated companies and contacts, and line items.
        </Text>
        <Flex direction="column" gap="sm">
          <Text format={{ fontWeight: 'bold' }}>
            Enter a name for the new deal:
          </Text>
          <Input
            name="newDealName"
            onInput={(v) => setNewDealName(v)}
            required={true}
          />
          <Text format={{ fontWeight: 'bold' }}>
            Associations and line items to be copied:
          </Text>
          <DescriptionList direction="row">
            <DescriptionListItem label="Companies">
              {dealData.associations.company_collection.total}
            </DescriptionListItem>
            <DescriptionListItem label="Contacts">
              {dealData.associations.contact_collection.total}
            </DescriptionListItem>
            <DescriptionListItem label="Line Items">
              {dealData.lineItemCount}
            </DescriptionListItem>
          </DescriptionList>
          <Flex direction="row" justify="end">
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
    );
  }

  if (url) {
    return <Link href={url}>{url}</Link>;
  }

  return null;
};

export default Extension;
