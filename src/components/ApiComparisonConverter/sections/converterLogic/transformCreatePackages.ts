import type { Shipment, TransformationResultPart } from '../../appTypes';
import { extractValue, extractNestedValue } from '../../utils';

export const transformCreatePackagesToRest = (
  xml: string,
  t: (key: string) => string | string[]
): TransformationResultPart => {
  const customerUniqueImportId = extractValue(xml, 'CustomerUniqueImportId');
  const referenceIdValue = customerUniqueImportId
    ? customerUniqueImportId
    : (t('converterMissingRequiredFieldPlaceholder') as string) ||
      'CHYBI_POVINNY_PARAMETR';

  const integratorId = extractValue(xml, 'IntegrId') ?? undefined;

  // Mapování číselných ProductType na ISO kódy
const productTypeMapping: { [key: string]: string } = {
  '1': 'BUSS',
  '2': 'BUSD', 
  '3': 'MAXP',
  '4': 'MAXD',
  '7': 'DOPD',
  '8': 'DOPD',
  '9': 'COPL',
  '10': 'BUED',
  '11': 'IMPO',
  '12': 'IMPD',
  '13': 'PRIV',
  '14': 'PRID',
  '36': 'CONN',
  '37': 'COND',
  '41': 'RETC',
  '42': 'EURO',
  '43': 'EURD',
  '45': 'RETD',
  '46': 'SMAR',
  '47': 'SMAD',
  '48': 'SMEU',
  '49': 'SMED',
  '50': 'RECI',
  '51': 'RECE'
};

const rawProductType = extractValue(xml, 'PackProductType');
const productType = rawProductType ? (productTypeMapping[rawProductType] || rawProductType) : 'BUSS';

const shipment: Partial<Shipment> = {
  productType: productType,
    referenceId: referenceIdValue,
    note: extractValue(xml, 'Note') ?? undefined,
    depot: extractValue(xml, 'DepoCode') ?? undefined,
    sender: {
      name:
        extractNestedValue(xml, 'Sender', 'Name') ||
        `${t('converterMissingFieldName') as string} ${
          t('senderName') as string
        }`,
      street:
        extractNestedValue(xml, 'Sender', 'Street') ||
        `${t('converterMissingFieldName') as string} ${
          t('senderStreet') as string
        }`,
      city:
        extractNestedValue(xml, 'Sender', 'City') ||
        `${t('converterMissingFieldName') as string} ${
          t('senderCity') as string
        }`,
      zipCode:
        extractNestedValue(xml, 'Sender', 'ZipCode') ||
        `${t('converterMissingFieldName') as string} ${
          t('senderZipCode') as string
        }`,
      country: extractNestedValue(xml, 'Sender', 'Country') || 'CZ',
      name2: extractNestedValue(xml, 'Sender', 'Name2') ?? undefined,
      contact: extractNestedValue(xml, 'Sender', 'Contact') ?? undefined,
      phone: extractNestedValue(xml, 'Sender', 'Phone') ?? undefined,
      email: extractNestedValue(xml, 'Sender', 'Email') ?? undefined,
    },
    recipient: {
      name:
        extractNestedValue(xml, 'Recipient', 'Name') ||
        `${t('converterMissingFieldName') as string} ${
          t('recipientName') as string
        }`,
      street:
        extractNestedValue(xml, 'Recipient', 'Street') ||
        `${t('converterMissingFieldName') as string} ${
          t('recipientStreet') as string
        }`,
      city:
        extractNestedValue(xml, 'Recipient', 'City') ||
        `${t('converterMissingFieldName') as string} ${
          t('recipientCity') as string
        }`,
      zipCode:
        extractNestedValue(xml, 'Recipient', 'ZipCode') ||
        `${t('converterMissingFieldName') as string} ${
          t('recipientZipCode') as string
        }`,
      country: extractNestedValue(xml, 'Recipient', 'Country') || 'CZ',
      phone:
        extractNestedValue(xml, 'Recipient', 'Phone') ||
        `${t('converterMissingFieldName') as string} ${
          t('recipientPhone') as string
        }`,
      email:
        extractNestedValue(xml, 'Recipient', 'Email') ||
        `${t('converterMissingFieldName') as string} ${
          t('recipientEmail') as string
        }`,
      name2: extractNestedValue(xml, 'Recipient', 'Name2') ?? undefined,
      contact: extractNestedValue(xml, 'Recipient', 'Contact') ?? undefined,
    },
  };

  const packagesInSet = extractNestedValue(xml, 'PackageSet', 'PackagesInSet');
  if (packagesInSet) {
    shipment.shipmentSet = {
      numberOfShipments: parseInt(packagesInSet, 10) || 1,
    };
  }

  let notes: Array<{
    type: 'warning' | 'info';
    parameter: string;
    message: string;
  }> = [];

  if (
    shipment.recipient &&
    (!shipment.recipient.phone ||
      (shipment.recipient.phone as string).startsWith(
        t('converterMissingFieldName') as string
      ))
  ) {
    const missingFieldKey = 'recipient.phone';
    notes.push({
      type: 'warning',
      parameter: missingFieldKey,
      message: `${
        t('converterMissingRequiredFieldSimple') as string
      } ${missingFieldKey}. ${t('converterRequiredInRestSimple') as string}`,
    });
    if (shipment.recipient)
      shipment.recipient.phone = t('converterRequiredPlaceholder') as string;
  }

  if (
    shipment.recipient &&
    (!shipment.recipient.email ||
      (shipment.recipient.email as string).startsWith(
        t('converterMissingFieldName') as string
      ))
  ) {
    const missingFieldKey = 'recipient.email';
    notes.push({
      type: 'warning',
      parameter: missingFieldKey,
      message: `${
        t('converterMissingRequiredFieldSimple') as string
      } ${missingFieldKey}. ${t('converterRequiredInRestSimple') as string}`,
    });
    if (shipment.recipient)
      shipment.recipient.email = t('converterRequiredPlaceholder') as string;
  }

 const weightStr = extractValue(xml, 'Weight');
if (weightStr) {
  const weightValue = parseFloat(weightStr.replace(',', '.'));
  if (!isNaN(weightValue)) {
    // Váha se vždy ukládá do shipmentSet -> shipmentSetItems[0] -> weighedShipmentInfo
    if (!shipment.shipmentSet) {
      shipment.shipmentSet = {
        numberOfShipments: 1,
      };
    }

    if (!(shipment.shipmentSet as any).shipmentSetItems) {
      (shipment.shipmentSet as any).shipmentSetItems = [{}];
    }

    if (!(shipment.shipmentSet as any).shipmentSetItems[0]) {
      (shipment.shipmentSet as any).shipmentSetItems[0] = {};
    }

    (shipment.shipmentSet as any).shipmentSetItems[0].weighedShipmentInfo = {
      weight: weightValue,
    };
  }
}

  const parcelShopCode = extractNestedValue(
    xml,
    'SpecDelivery',
    'ParcelShopCode'
  );
  if (parcelShopCode) {
    shipment.specificDelivery = { parcelShopCode };
  }

  const codCurrency = extractNestedValue(xml, 'PaymentInfo', 'CodCurrency');
  const codPriceStr = extractNestedValue(xml, 'PaymentInfo', 'CodPrice');
  const codVarSym = extractNestedValue(xml, 'PaymentInfo', 'CodVarSym');

  if (codCurrency || codPriceStr || codVarSym) {
    shipment.cashOnDelivery = {};
    if (codCurrency) shipment.cashOnDelivery.codCurrency = codCurrency;
    if (codPriceStr) {
      const priceNum = parseFloat(codPriceStr.replace(',', '.'));
      if (!isNaN(priceNum)) {
        shipment.cashOnDelivery.codPrice = priceNum;
      }
    }
    if (codVarSym) shipment.cashOnDelivery.codVarSym = codVarSym;
  }

  const extNumber = extractNestedValue(xml, 'PackagesExtNums', 'ExtNumber');
  if (extNumber) {
    shipment.externalNumbers = [{ code: 'CUST', externalNumber: extNumber }];
  }

  const ageCheck = extractValue(xml, 'AgeVerification');
  if (ageCheck && (ageCheck.toLowerCase() === 'true' || ageCheck === '1')) {
    shipment.services = [{ code: 'AGE_VERIFICATION' }];
  }

  const restBody: any = {
    returnChannel: { type: 'None' },
    labelSettings: { format: 'Pdf', dpi: 300 },
    shipments: [shipment as Shipment],
  };

  if (integratorId) {
    restBody.integratorId = integratorId;
  }

  return {
    method: 'POST',
    path: '/shipment/batch',
    body: restBody,
    queryParams: undefined, // Důležité: musí být přítomno
    notes: notes.length > 0 ? notes : undefined,
  };
};
