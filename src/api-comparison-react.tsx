import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  ArrowRight 
} from 'lucide-react';

type Field = {
  soapField: string;
  restField: string;
  soapType: string;
  restType: string;
  soapRequired: boolean;
  restRequired: boolean;
  soapLength: string;
  restLength: string;
  notes: string;
};

type TabName = 'endpoints' | 'fields' | 'codelist' | 'differences';

// Mapování REST endpointů na URL dokumentace
const endpointDocUrls: Record<string, string> = {
  'GET /codelist/ageCheck':
    'Číselník pro službu kontroly věku příjemce - CPL API',
  'GET /codelist/product': 'Číselník produktů - CPL API',
  'GET /codelist/externalNumber':
    'https://ppl-cpl-api.apidog.io/%C4%8D%C3%ADseln%C3%ADk-typ%C5%AF-extern%C3%ADch-%C4%8D%C3%ADsel-13465891e0',
  'GET /codelist/country':
    'https://ppl-cpl-api.apidog.io/%C4%8D%C3%ADseln%C3%ADk-zem%C3%AD-povolen%C3%AD-cod-13465892e0',
  'GET /codelist/currency':
    'https://ppl-cpl-api.apidog.io/%C4%8D%C3%ADseln%C3%ADk-povolen%C3%BDch-m%C4%9Bn-13465893e0',
  'GET /codelist/service':
    'https://ppl-cpl-api.apidog.io/metoda-pro-z%C3%ADsk%C3%A1n%C3%AD-poskytovan%C3%BDch-slu%C5%BEeb-k-z%C3%A1silk%C3%A1m-13465894e0',
  'GET /codelist/servicePriceLimit':
    'https://ppl-cpl-api.apidog.io/metoda-pro-z%C3%ADsk%C3%A1n%C3%AD-minim%C3%A1ln%C3%ADch-a-maxim%C3%A1ln%C3%ADch-hodnot-u-slu%C5%BEeb-13465895e0',
  'GET /codelist/shipmentPhase':
    'https://ppl-cpl-api.apidog.io/f%C3%A1ze-z%C3%A1silky-13465896e0',
  'GET /codelist/proofOfIdentityType':
    'https://ppl-cpl-api.apidog.io/typy-osobn%C3%ADch-doklad%C5%AF-13465899e0',
  'GET /accessPoint':
    'https://ppl-cpl-api.apidog.io/seznam-v%C3%BDdejních-m%C3%ADst-13465887e0',
  'GET /addressWhisper':
    'https://ppl-cpl-api.apidog.io/na%C5%A1ept%C3%A1va%C4%8D-adres-13465888e0',
  'GET /info': 'https://ppl-cpl-api.apidog.io/info-13465906e0',
  'GET /order':
    'https://ppl-cpl-api.apidog.io/z%C3%ADsk%C3%A1n%C3%AD-informace-o-objedn%C3%A1vce-p%C5%99epravy-13465909e0',
  'POST /order/batch':
    'https://ppl-cpl-api.apidog.io/slou%C5%BE%C3%AD-k-vytvo%C5%99en%C3%AD-objedn%C3%A1vky-odpov%C4%9B%C4%8F-je-v-header-location-13465910e0',
  'GET /order/batch/{batchId}':
    'https://ppl-cpl-api.apidog.io/z%C3%ADskan%C3%AD-stavu-objednávky-13465911e0',
  'POST /order/cancel':
    'https://ppl-cpl-api.apidog.io/zru%C5%A1en%C3%AD-objedn%C3%A1n%C3%AD-svozu-nebo-bal%C3%ADku-z-libovoln%C3%A9-adresy-13465912e0',
  'GET /shipment':
    'https://ppl-cpl-api.apidog.io/slou%C5%BE%C3%AD-k-z%C3%ADsk%C3%A1n%C3%AD-informac%C3%AD-trackingu-k-z%C3%A1silce-13465913e0',
  'POST /shipment/batch':
    'https://ppl-cpl-api.apidog.io/vytvo%C5%99en%C3%AD-z%C3%A1silky-13465914e0',
  'PUT /shipment/batch/{batchId}':
    'https://ppl-cpl-api.apidog.io/slou%C5%BE%C3%AD-k-%C3%BAprav%C4%9B-v%C3%BDstupn%C3%ADho-form%C3%A1tu-%C5%A1t%C3%ADtku-13465915e0',
  'GET /shipment/batch/{batchId}': 'Získání stavu importu zásilky - CPL API',
  'GET /shipment/batch/{batchId}/label': 'Získání etikety - CPL API',
  'POST /shipment/{shipmentNumber}/cancel': 'storno zásilky - CPL API',
  'POST /shipment/{shipmentNumber}/redirect': 'úprava kontaktu - CPL API',
  'GET /versionInformation': 'informace o novinkách - CPL API',
};
// Definice dat pro API porovnání
const apiData = {
  // Kategorie API endpointů
  categories: [
    {
      id: 'shipment',
      name: 'Zásilky',
      description: 'Vytvoření a sledování zásilek',
    },
    {
      id: 'order',
      name: 'Objednávky',
      description: 'Správa objednávek přepravy',
    },
    {
      id: 'accesspoint',
      name: 'Výdejní místa',
      description: 'Práce s výdejními místy',
    },
    {
      id: 'codelist',
      name: 'Číselníky',
      description: 'Referenční data a číselníky',
    },
    { id: 'auth', name: 'Autentizace', description: 'Přihlášení a autorizace' },
  ],

  // Mapování SOAP operací na REST endpointy
  endpointMappings: [
    {
      category: 'shipment',
      soapOperation: 'CreatePackages',
      soapDescription: 'Vloží nové zásilky pro import a vytvoří štítky',
      restEndpoint: 'POST /shipment/batch',
      restDescription: 'Slouží k vytvoření zásilky a získání štítků',
      mainDifferences:
        'REST API poskytuje více validačních pravidel, má jiný formát odpovědi a používá camelCase',
      docUrl:
        'https://ppl-cpl-api.apidog.io/vytvo%C5%99en%C3%AD-z%C3%A1silky-13465914e0',
    },
    {
      category: 'shipment',
      soapOperation: 'GetPackages',
      soapDescription: 'Vrátí seznam zásilek dle zadaného filtru',
      restEndpoint: 'GET /shipment',
      restDescription: 'Slouží k získání informací (trackingu) k zásilce',
      mainDifferences:
        'REST API používá query parametry místo komplexního filtru v těle',
      docUrl:
        'https://ppl-cpl-api.apidog.io/slou%C5%BE%C3%AD-k-z%C3%ADsk%C3%A1n%C3%AD-informac%C3%AD-trackingu-k-z%C3%A1silce-13465913e0',
    },
    {
      category: 'shipment',
      soapOperation: 'CancelPackage',
      soapDescription: 'Zrušení zásilky',
      restEndpoint: 'POST /shipment/{shipmentNumber}/cancel',
      restDescription: 'Možnost stornovat balík, pokud nebyl fyzicky poslán',
      mainDifferences: 'REST API využívá URL parametr pro identifikaci zásilky',
      docUrl: 'storno zásilky - CPL API',
    },
    {
      category: 'shipment',
      soapOperation: 'UpdatePackage',
      soapDescription: 'Aktualizace údajů zásilky',
      restEndpoint: 'POST /shipment/{shipmentNumber}/redirect',
      restDescription: 'Možnost doplnit informace k balíku',
      mainDifferences: 'REST API poskytuje omezenější možnosti aktualizace',
      docUrl: 'úprava kontaktu - CPL API',
    },
    {
      category: 'order',
      soapOperation: 'CreateOrders',
      soapDescription: 'Vytvoří objednávky přepravy',
      restEndpoint: 'POST /order/batch',
      restDescription: 'Slouží k vytvoření objednávky',
      mainDifferences:
        'REST API má detailnější strukturu a explicitní kontroly délky polí',
      docUrl:
        'https://ppl-cpl-api.apidog.io/slou%C5%BE%C3%AD-k-vytvo%C5%99en%C3%AD-objedn%C3%A1vky-odpov%C4%9B%C4%8F-je-v-header-location-13465910e0',
    },
    {
      category: 'order',
      soapOperation: 'CreatePickupOrders',
      soapDescription: 'Vytvoří objednávky svozu',
      restEndpoint: 'POST /order/batch',
      restDescription: 'Slouží k vytvoření objednávky svozu',
      mainDifferences:
        'V REST API je typ objednávky určen parametrem orderType',
      docUrl:
        'https://ppl-cpl-api.apidog.io/slou%C5%BE%C3%AD-k-vytvo%C5%99en%C3%AD-objedn%C3%A1vky-odpov%C4%9B%C4%8F-je-v-header-location-13465910e0',
    },
    {
      category: 'order',
      soapOperation: 'GetOrders',
      soapDescription: 'Vrátí seznam objednávek dle zadaného filtru',
      restEndpoint: 'GET /order',
      restDescription: 'Sledování stavu objednávek',
      mainDifferences:
        'REST API používá query parametry místo komplexního filtru v těle',
      docUrl:
        'https://ppl-cpl-api.apidog.io/z%C3%ADsk%C3%A1n%C3%AD-informace-o-objedn%C3%A1vce-p%C5%99epravy-13465909e0',
    },
    {
      category: 'order',
      soapOperation: 'CancelOrder',
      soapDescription: 'Zrušení objednávky',
      restEndpoint: 'POST /order/cancel',
      restDescription: 'Zrušení objednání svozu nebo balíku z libovolné adresy',
      mainDifferences:
        'REST API používá query parametry pro identifikaci objednávky',
      docUrl:
        'https://ppl-cpl-api.apidog.io/zru%C5%A1en%C3%AD-objedn%C3%A1n%C3%AD-svozu-nebo-bal%C3%ADku-z-libovoln%C3%A9-adresy-13465912e0',
    },
    {
      category: 'accesspoint',
      soapOperation: 'GetParcelShops',
      soapDescription: 'Vrátí seznam ParcelShopů',
      restEndpoint: 'GET /accessPoint',
      restDescription: 'Seznam výdejních míst',
      mainDifferences:
        'REST API má rozšířené možnosti filtrování a detailnější strukturu',
      docUrl:
        'https://ppl-cpl-api.apidog.io/seznam-v%C3%BDdejních-m%C3%ADst-13465887e0',
    },
    {
      category: 'codelist',
      soapOperation: 'GetCodCurrency',
      soapDescription: 'Vrátí povolené měny pro dobírku',
      restEndpoint: 'GET /codelist/currency',
      restDescription: 'Číselník povolených měn',
      mainDifferences:
        'REST API používá standardizovaný formát pro všechny číselníky',
      docUrl:
        'https://ppl-cpl-api.apidog.io/%C4%8D%C3%ADseln%C3%ADk-povolen%C3%BDch-m%C4%9Bn-13465893e0',
    },
    {
      category: 'codelist',
      soapOperation: 'GetPackProducts',
      soapDescription: 'Vrátí seznam produktů',
      restEndpoint: 'GET /codelist/product',
      restDescription: 'Číselník produktů',
      mainDifferences:
        'REST API používá standardizovaný formát pro všechny číselníky',
      docUrl: 'Číselník produktů - CPL API',
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/ageCheck',
      restDescription: 'Číselník pro službu kontroly věku příjemce',
      mainDifferences: 'Dostupné pouze v REST API',
      docUrl: 'Číselník pro službu kontroly věku příjemce - CPL API',
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/externalNumber',
      restDescription: 'Číselník typů externích čísel',
      mainDifferences: 'Dostupné pouze v REST API',
      docUrl:
        'https://ppl-cpl-api.apidog.io/%C4%8D%C3%ADseln%C3%ADk-typ%C5%AF-extern%C3%ADch-%C4%8D%C3%ADsel-13465891e0',
    },
    {
      category: 'codelist',
      soapOperation: 'GetProductCountry',
      soapDescription: 'Vrátí země a produkty pro zákazníka',
      restEndpoint: 'GET /codelist/country',
      restDescription: 'Číselník zemí + povolení COD',
      mainDifferences: 'REST API poskytuje jednodušší strukturu',
      docUrl:
        'https://ppl-cpl-api.apidog.io/%C4%8D%C3%ADseln%C3%ADk-zem%C3%AD-povolen%C3%AD-cod-13465892e0',
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/service',
      restDescription: 'Metoda pro získání poskytovaných služeb k zásilkám',
      mainDifferences: 'Dostupné pouze v REST API',
      docUrl:
        'https://ppl-cpl-api.apidog.io/metoda-pro-z%C3%ADsk%C3%A1n%C3%AD-poskytovan%C3%BDch-slu%C5%BEeb-k-z%C3%A1silk%C3%A1m-13465894e0',
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/servicePriceLimit',
      restDescription:
        'Metoda pro získání minimálních a maximálních hodnot u služeb',
      mainDifferences: 'Dostupné pouze v REST API',
      docUrl:
        'https://ppl-cpl-api.apidog.io/metoda-pro-z%C3%ADsk%C3%A1n%C3%AD-minim%C3%A1ln%C3%ADch-a-maxim%C3%A1ln%C3%ADch-hodnot-u-slu%C5%BEeb-13465895e0',
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/shipmentPhase',
      restDescription: 'Fáze zásilky',
      mainDifferences: 'Dostupné pouze v REST API',
      docUrl: 'https://ppl-cpl-api.apidog.io/f%C3%A1ze-z%C3%A1silky-13465896e0',
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/status',
      restDescription: 'Statusy zásilky /shipment',
      mainDifferences: 'Dostupné pouze v REST API',
      docUrl: '',
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/validationMessage',
      restDescription: 'Chybové hlášení',
      mainDifferences: 'Dostupné pouze v REST API',
      docUrl: '',
    },
    {
      category: 'codelist',
      soapOperation: 'N/A',
      soapDescription: 'Nepodporováno v SOAP',
      restEndpoint: 'GET /codelist/proofOfIdentityType',
      restDescription: 'Typy osobních dokladů',
      mainDifferences: 'Dostupné pouze v REST API',
      docUrl:
        'https://ppl-cpl-api.apidog.io/typy-osobn%C3%ADch-doklad%C5%AF-13465899e0',
    },
    {
      category: 'auth',
      soapOperation: 'Login',
      soapDescription: 'Vrátí autentikační ticket',
      restEndpoint: 'OAuth2/JWT autentizace',
      restDescription: 'Standardní autentizace pomocí Bearer tokenu',
      mainDifferences:
        'REST API používá standardní OAuth2/JWT mechanismus místo vlastního',
      docUrl: '',
    },
  ],
  // Detailní porovnání polí pro vybrané operace
  fieldMappings: {
    'shipment-create': {
      title: 'Vytvoření zásilky',
      description: 'Porovnání struktur pro vytvoření zásilky',
      soapOperation: 'CreatePackages',
      restEndpoint: 'POST /shipment/batch',
      docUrl:
        'https://ppl-cpl-api.apidog.io/vytvo%C5%99en%C3%AD-z%C3%A1silky-13465914e0',
      fields: [
        {
          soapField: 'PackNumber',
          restField: 'shipmentNumber',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Číslo zásilky',
        },
        {
          soapField: 'PackProductType',
          restField: 'productType',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Typ produktu',
        },
        {
          soapField: 'Note',
          restField: 'note',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '300',
          notes: 'Poznámka k zásilce',
        },
        {
          soapField: 'DepoCode',
          restField: 'depot',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '2',
          notes: 'Kód depa',
        },
        {
          soapField: 'Sender.Name',
          restField: 'sender.name',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Jméno odesílatele',
        },
        {
          soapField: 'Sender.Name2',
          restField: 'sender.name2',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Doplňující jméno odesílatele',
        },
        {
          soapField: 'Sender.Street',
          restField: 'sender.street',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '60',
          notes: 'Ulice odesílatele',
        },
      ],
    },
    tracking: {
      title: 'Sledování zásilky',
      description: 'Porovnání struktur pro získání informací o zásilce',
      soapOperation: 'GetPackages',
      restEndpoint: 'GET /shipment',
      docUrl:
        'https://ppl-cpl-api.apidog.io/slou%C5%BE%C3%AD-k-z%C3%ADsk%C3%A1n%C3%AD-informac%C3%AD-trackingu-k-z%C3%A1silce-13465913e0',
      fields: [
        {
          soapField: 'Filter.PackNumbers[]',
          restField: 'ShipmentNumbers[]',
          soapType: 'string[]',
          restType: 'string[]',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Max 50 položek',
          restLength: 'Max 50 položek',
          notes: 'Čísla zásilek',
        },
        {
          soapField: 'Filter.CustRefs[]',
          restField: 'CustomerReferences[]',
          soapType: 'string[]',
          restType: 'string[]',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Max 50 položek',
          restLength: 'Max 50 položek',
          notes: 'Reference zákazníka',
        },
        {
          soapField: 'Filter.DateFrom',
          restField: 'DateFrom',
          soapType: 'dateTime',
          restType: 'dateTime',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Počáteční datum rozsahu',
        },
        {
          soapField: 'Filter.DateTo',
          restField: 'DateTo',
          soapType: 'dateTime',
          restType: 'dateTime',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Koncové datum rozsahu',
        },
        {
          soapField: 'Filter.PackageStates',
          restField: 'ShipmentStates',
          soapType: 'enum',
          restType: 'enum',
          soapRequired: false,
          restRequired: false,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Stavy zásilek',
        },
        {
          soapField: 'PackNumber',
          restField: 'shipmentNumber',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Číslo zásilky',
        },
      ],
    },
    'accesspoint-get': {
      title: 'Výdejní místa',
      description:
        'Porovnání struktur pro získání informací o výdejních místech',
      soapOperation: 'GetParcelShops',
      restEndpoint: 'GET /accessPoint',
      docUrl:
        'https://ppl-cpl-api.apidog.io/seznam-v%C3%BDdejních-m%C3%ADst-13465887e0',
      fields: [
        {
          soapField: 'Filter.Code',
          restField: 'AccessPointCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Kód výdejního místa',
        },
        {
          soapField: 'Filter.CountryCode',
          restField: 'CountryCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Kód země',
        },
        {
          soapField: 'Filter.ZipCode',
          restField: 'ZipCode',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'PSČ',
        },
      ],
    },
    'order-create': {
      title: 'Vytvoření objednávky',
      description: 'Porovnání struktur pro vytvoření objednávky přepravy',
      soapOperation: 'CreateOrders',
      restEndpoint: 'POST /order/batch',
      docUrl:
        'https://ppl-cpl-api.apidog.io/slou%C5%BE%C3%AD-k-vytvo%C5%99en%C3%AD-objedn%C3%A1vky-odpov%C4%9B%C4%8F-je-v-header-location-13465910e0',
      fields: [
        {
          soapField: 'OrdRefId',
          restField: 'referenceId',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '50',
          notes: 'Reference objednávky',
        },
        {
          soapField: 'PackProductType',
          restField: 'productType',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '4',
          notes: 'Typ produktu',
        },
      ],
    },
    'codelist-currency': {
      title: 'Číselník měn',
      description: 'Porovnání struktur pro získání seznamu povolených měn',
      soapOperation: 'GetCodCurrency',
      restEndpoint: 'GET /codelist/currency',
      docUrl:
        'https://ppl-cpl-api.apidog.io/%C4%8D%C3%ADseln%C3%ADk-povolen%C3%BDch-m%C4%9Bn-13465893e0',
      fields: [
        {
          soapField: 'CurrencyCode',
          restField: 'code',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '3',
          notes: 'Kód měny',
        },
        {
          soapField: 'CurrencyName',
          restField: 'name',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Název měny',
        },
      ],
    },
    'codelist-product': {
      title: 'Číselník produktů',
      description: 'Porovnání struktur pro získání seznamu produktů',
      soapOperation: 'GetPackProducts',
      restEndpoint: 'GET /codelist/product',
      docUrl: 'Číselník produktů - CPL API',
      fields: [
        {
          soapField: 'ProductCode',
          restField: 'code',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '4',
          notes: 'Kód produktu',
        },
        {
          soapField: 'ProductName',
          restField: 'name',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Název produktu',
        },
        {
          soapField: 'ProductDesc',
          restField: 'description',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Popis produktu',
        },
      ],
    },
    'codelist-country': {
      title: 'Číselník zemí',
      description: 'Porovnání struktur pro získání seznamu zemí',
      soapOperation: 'GetProductCountry',
      restEndpoint: 'GET /codelist/country',
      docUrl:
        'https://ppl-cpl-api.apidog.io/%C4%8D%C3%ADseln%C3%ADk-zem%C3%AD-povolen%C3%AD-cod-13465892e0',
      fields: [
        {
          soapField: 'CountryCode',
          restField: 'code',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: '2',
          notes: 'Kód země',
        },
        {
          soapField: 'CountryName',
          restField: 'name',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Název země',
        },
        {
          soapField: 'IsCODAllowed',
          restField: 'isCodAllowed',
          soapType: 'boolean',
          restType: 'boolean',
          soapRequired: false,
          restRequired: true,
          soapLength: 'N/A',
          restLength: 'N/A',
          notes: 'Povolení dobírky',
        },
      ],
    },
    'order-get': {
      title: 'Sledování objednávek',
      description: 'Porovnání struktur pro získání informací o objednávkách',
      soapOperation: 'GetOrders',
      restEndpoint: 'GET /order',
      docUrl:
        'https://ppl-cpl-api.apidog.io/z%C3%ADsk%C3%A1n%C3%AD-informace-o-objedn%C3%A1vce-p%C5%99epravy-13465909e0',
      fields: [
        {
          soapField: 'Filter.OrderNumbers[]',
          restField: 'OrderNumbers[]',
          soapType: 'string[]',
          restType: 'string[]',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Max 50 položek',
          restLength: 'Max 50 položek',
          notes: 'Čísla objednávek',
        },
        {
          soapField: 'Filter.CustRefs[]',
          restField: 'CustomerReferences[]',
          soapType: 'string[]',
          restType: 'string[]',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Max 50 položek',
          restLength: 'Max 50 položek',
          notes: 'Reference zákazníka',
        },
      ],
    },

    'shipment-cancel': {
      title: 'Zrušení zásilky',
      description: 'Porovnání struktur pro zrušení zásilky',
      soapOperation: 'CancelPackage',
      restEndpoint: 'POST /shipment/{shipmentNumber}/cancel',
      docUrl: 'storno zásilky - CPL API',
      fields: [
        {
          soapField: 'PackNumber',
          restField: 'shipmentNumber (v URL)',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Číslo zásilky (v REST API je součástí URL)',
        },
        {
          soapField: 'Note',
          restField: 'note',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '300',
          notes: 'Poznámka ke zrušení zásilky',
        },
        {
          soapField: 'ResultStatus',
          restField: 'HTTP status kód',
          soapType: 'string',
          restType: 'integer',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'N/A',
          notes:
            'Výsledek operace (v REST API reprezentováno HTTP stavovým kódem)',
        },
        {
          soapField: 'ResultMessage',
          restField: 'message',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Popis výsledku operace',
        },
      ],
    },
    'shipment-redirect': {
      title: 'Přesměrování zásilky',
      description: 'Porovnání struktur pro aktualizaci/přesměrování zásilky',
      soapOperation: 'UpdatePackage',
      restEndpoint: 'POST /shipment/{shipmentNumber}/redirect',
      docUrl: 'úprava kontaktu - CPL API',
      fields: [
        {
          soapField: 'PackNumber',
          restField: 'shipmentNumber (v URL)',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Číslo zásilky (v REST API je součástí URL)',
        },
      ],
    },
    'order-cancel': {
      title: 'Zrušení objednávky',
      description: 'Porovnání struktur pro zrušení objednávky',
      soapOperation: 'CancelOrder',
      restEndpoint: 'POST /order/cancel',
      docUrl:
        'https://ppl-cpl-api.apidog.io/zru%C5%A1en%C3%AD-objedn%C3%A1n%C3%AD-svozu-nebo-bal%C3%ADku-z-libovoln%C3%A9-adresy-13465912e0',
      fields: [
        {
          soapField: 'OrderNumber',
          restField: 'orderNumber',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Číslo objednávky',
        },
        {
          soapField: 'CustRef',
          restField: 'customerReference',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '40',
          notes: 'Reference zákazníka',
        },
        {
          soapField: 'Note',
          restField: 'note',
          soapType: 'string',
          restType: 'string',
          soapRequired: false,
          restRequired: false,
          soapLength: 'Neomezeno',
          restLength: '300',
          notes: 'Poznámka ke zrušení objednávky',
        },
      ],
    },
    'auth-login': {
      title: 'Autentizace',
      description: 'Porovnání struktur pro autentizaci',
      soapOperation: 'Login',
      restEndpoint: 'OAuth2/JWT autentizace',
      docUrl: '',
      fields: [
        {
          soapField: 'Username',
          restField: 'client_id',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Uživatelské jméno / ID klienta',
        },
        {
          soapField: 'Password',
          restField: 'client_secret',
          soapType: 'string',
          restType: 'string',
          soapRequired: true,
          restRequired: true,
          soapLength: 'Neomezeno',
          restLength: 'Neomezeno',
          notes: 'Heslo / Tajný klíč klienta',
        },
      ],
    },
  },

  // Obecné rozdíly mezi API
  generalDifferences: [
    {
      category: 'Autentizace',
      soapApproach:
        'Vlastní autentizační model s přihlašovacími údaji v Auth elementu:',
      soapExample:
        '<Auth>\n  <UserName>username</UserName>\n  <Password>password</Password>\n  <!-- Nebo -->\n  <AuthToken>token</AuthToken>\n</Auth>',
      restApproach: 'Standardní OAuth2 nebo JWT autentizace:',
      restExample: 'Authorization: Bearer {token}',
      importance: 'high',
    },
    {
      category: 'Konvence pojmenování',
      soapApproach: 'PascalCase konvence pro názvy polí',
      soapExample: 'PackNumber, PackProductType, RecipientName',
      restApproach: 'camelCase konvence pro názvy polí',
      restExample: 'shipmentNumber, productType, recipientName',
      importance: 'medium',
    },
    {
      category: 'Formát požadavků a odpovědí',
      soapApproach: 'XML struktura s SOAP obálkou',
      soapExample:
        '<soapenv:Envelope xmlns:soapenv="...">\n  <soapenv:Header/>\n  <soapenv:Body>\n    <tns:CreatePackages>\n      <!-- obsah -->\n    </tns:CreatePackages>\n  </soapenv:Body>\n</soapenv:Envelope>',
      restApproach: 'JSON struktura',
      restExample:
        '{\n  "shipments": [\n    {\n      "referenceId": "id123",\n      "productType": "BUSS",\n      /* další pole */\n    }\n  ]\n}',
      importance: 'high',
    },
    {
      category: 'Komunikační model',
      soapApproach: 'RPC model s operacemi',
      soapExample: 'CreatePackages, GetPackages, LoginUser',
      restApproach: 'Resourceový model s HTTP metodami',
      restExample: 'POST /shipment/batch, GET /shipment, GET /accessPoint',
      importance: 'high',
    },
    {
      category: 'Zpracování chyb',
      soapApproach: 'SOAP Fault struktury s vlastními chybovými kódy',
      soapExample:
        '<soapenv:Fault>\n  <faultcode>soap:Server</faultcode>\n  <faultstring>Validační chyba</faultstring>\n  <detail>\n    <ValidationFault>...</ValidationFault>\n  </detail>\n</soapenv:Fault>',
      restApproach: 'HTTP stavové kódy s JSON chybovými objekty',
      restExample:
        '{\n  "type": "error-type",\n  "title": "Validační chyba",\n  "status": 400,\n  "detail": "Detailní popis chyby",\n  "errors": {\n    "field1": ["Chybová zpráva 1"],\n    "field2": ["Chybová zpráva 2"]\n  }\n}',
      importance: 'high',
    },
    {
      category: 'Limity délky polí',
      soapApproach: 'Většinou bez explicitního omezení délky polí',
      soapExample:
        'Pole jako PackNumber, Note, Street nemají pevně stanovenou maximální délku',
      restApproach: 'Explicitní definice maximálních délek pro většinu polí',
      restExample:
        'shipmentNumber: neomezeno, note: max 300, street: max 60, zipCode: max 10',
      importance: 'high',
    },
    {
      category: 'Stránkování',
      soapApproach: 'Stránkování pomocí komplexních filtrů',
      soapExample: 'Filter struktura s různými parametry',
      restApproach: 'Standardní stránkování pomocí Limit a Offset',
      restExample: '?Limit=100&Offset=0 s hlavičkami X-Paging-*',
      importance: 'medium',
    },
    {
      category: 'Dokumentace',
      soapApproach: 'WSDL soubor s XML schématem',
      soapExample: '<wsdl:definitions xmlns:wsdl="...">...</wsdl:definitions>',
      restApproach: 'OpenAPI (Swagger) specifikace',
      restExample:
        '{\n  "openapi": "3.0.1",\n  "info": {\n    "title": "CPL API",\n    "version": "v1"\n  },\n  "paths": { ... }\n}',
      importance: 'medium',
    },
    {
      category: 'Číselníky',
      soapApproach: 'Omezený počet samostatných operací pro číselníky',
      soapExample: 'GetCodCurrency, GetPackProducts, GetProductCountry',
      restApproach:
        'Jednotný přístup ke všem číselníkům přes /codelist/* endpoint',
      restExample:
        'GET /codelist/currency, GET /codelist/product, GET /codelist/country',
      importance: 'high',
    },
  ],
};
// Hlavní komponent pro porovnání API
function ApiComparison() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFieldMapping, setSelectedFieldMapping] = useState<
    string | null
  >(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabName>('endpoints'); // endpoints, fields, differences, codelist
  const [expandedDifferences, setExpandedDifferences] = useState<number[]>([]);

  // Filtrování endpointů podle kategorie a vyhledávání
  const filteredEndpoints = apiData.endpointMappings.filter((endpoint) => {
    const matchesCategory = selectedCategory
      ? endpoint.category === selectedCategory
      : true;
    const matchesSearch =
      searchTerm.trim() === ''
        ? true
        : endpoint.soapOperation
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          endpoint.restEndpoint
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch && endpoint.category !== 'codelist';
  });

  const tabRefs = {
    endpoints: useRef<HTMLButtonElement>(null),
    fields: useRef<HTMLButtonElement>(null),
    codelist: useRef<HTMLButtonElement>(null),
    differences: useRef<HTMLButtonElement>(null)
  };
  
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: '0px',
    width: '0px'
  });
  useEffect(() => {
    const activeTabRef = tabRefs[activeTab];
    if (activeTabRef && activeTabRef.current) {
      const tabElement = activeTabRef.current;
      setIndicatorStyle({
        left: `${tabElement.offsetLeft}px`,
        width: `${tabElement.offsetWidth}px`
      });
    }
  }, [activeTab]);
<div className="flex border-b border-gray-200 mb-6 relative">
  <div
    className="absolute bottom-0 h-0.5 bg-blue-600 transition-all duration-300 ease-in-out"
    style={{
      left: indicatorStyle.left,
      width: indicatorStyle.width
    }}
  />
  <button
    ref={tabRefs.endpoints}
    className={`px-4 py-2 font-medium ${
      activeTab === 'endpoints'
        ? 'text-blue-600'
        : 'text-gray-600 hover:text-blue-600'
    }`}
    onClick={() => setActiveTab('endpoints')}
  >
    Mapování endpointů
  </button>
  <button
    ref={tabRefs.fields}
    className={`px-4 py-2 font-medium ${
      activeTab === 'fields'
        ? 'text-blue-600'
        : 'text-gray-600 hover:text-blue-600'
    }`}
    onClick={() => setActiveTab('fields')}
  >
    Porovnání polí
  </button>
  <button
    ref={tabRefs.codelist}
    className={`px-4 py-2 font-medium ${
      activeTab === 'codelist'
        ? 'text-blue-600'
        : 'text-gray-600 hover:text-blue-600'
    }`}
    onClick={() => setActiveTab('codelist')}
  >
    Číselníky
  </button>
  <button
    ref={tabRefs.differences}
    className={`px-4 py-2 font-medium ${
      activeTab === 'differences'
        ? 'text-blue-600'
        : 'text-gray-600 hover:text-blue-600'
    }`}
    onClick={() => setActiveTab('differences')}
  >
    Obecné rozdíly
  </button>
</div>
  // Filtrování pouze endpointů z kategorie codelist pro záložku Číselníků
  const codelistEndpoints = apiData.endpointMappings.filter((endpoint) => {
    return (
      endpoint.category === 'codelist' &&
      (searchTerm.trim() === ''
        ? true
        : endpoint.soapOperation
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          endpoint.restEndpoint
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))
    );
  });

  // Filtrování polí podle vyhledávání
  const getFilteredFields = (mappingId: string) => {
    if (!mappingId || !(mappingId in apiData.fieldMappings)) return [];

    const fields =
      apiData.fieldMappings[mappingId as keyof typeof apiData.fieldMappings]
        .fields;
    if (searchTerm.trim() === '') return fields;

    return fields.filter(
      (field) =>
        field.soapField.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.restField.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.notes.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Funkce pro zvýraznění rozdílů v požadavcích
  const highlightDifferences = (field: Field) => {
    const hasTypeDiff = field.soapType !== field.restType;
    const hasRequiredDiff = field.soapRequired !== field.restRequired;
    const hasLengthDiff = field.soapLength !== field.restLength;

    return {
      hasAnyDiff: hasTypeDiff || hasRequiredDiff || hasLengthDiff,
      hasTypeDiff,
      hasRequiredDiff,
      hasLengthDiff,
    };
  };

  // Funkce pro přepínání rozbalení rozdílu
  const toggleDifference = (index: number) => {
    if (expandedDifferences.includes(index)) {
      setExpandedDifferences(
        expandedDifferences.filter((item) => item !== index)
      );
    } else {
      setExpandedDifferences([...expandedDifferences, index]);
    }
  };
  // Render komponenty
  return (
    <div className="max-w-7xl mx-auto p-4 bg-white rounded-lg shadow">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">
        Porovnání myAPI (SOAP) vs CPL API (REST)
      </h1>

      {/* Navigační lišta */}
      <div className="flex border-b border-gray-200 mb-6">
     {/* <div className="flex border-b border-gray-200 mb-6 relative">
        <div
          className="absolute bottom-0 h-0.5 bg-blue-600 transition-all duration-300 ease-in-out"
          style={{
            left:
              activeTab === 'endpoints'
                ? '0%'
                : activeTab === 'fields'
                ? '21%'
                : activeTab === 'codelist'
                ? '45%'
                : '50%',
            width: '5%',
          }}
        />*/}
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'endpoints'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
          onClick={() => setActiveTab('endpoints')}
        >
          Mapování endpointů
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'fields'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
          onClick={() => setActiveTab('fields')}
        >
          Porovnání polí
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'codelist'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
          onClick={() => setActiveTab('codelist')}
        >
          Číselníky
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === 'differences'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-blue-600'
          }`}
          onClick={() => setActiveTab('differences')}
        >
          Obecné rozdíly
        </button>
      </div>
      
      {/* Vyhledávací panel */}
      <div className="flex flex-wrap items-center mb-6 gap-4">
        <div className="relative flex-grow max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Vyhledat"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      {/* Obsah záložky Mapování endpointů */}
      {activeTab === 'endpoints' && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  myAPI (SOAP)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  CPL API (REST)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Popis
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                 Akce
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Klíčové rozdíly
                </th>
               
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEndpoints.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Nebyly nalezeny žádné odpovídající endpointy
                  </td>
                </tr>
              ) : (
                filteredEndpoints.map((endpoint, index) => (
                  <tr
                    key={index}
                    id={`endpoint-row-${index}`}
                    className="hover:bg-blue-50 cursor-pointer transition-all duration-200 relative group"
                    onClick={() => {
                      // Původní kód pro nalezení mappingId
                      const mappingId = Object.keys(apiData.fieldMappings).find(key => {
                        const mapping = apiData.fieldMappings[key as keyof typeof apiData.fieldMappings];
                        return mapping.soapOperation === endpoint.soapOperation ||
                               mapping.restEndpoint === endpoint.restEndpoint;
                      });
                    
                      if (mappingId) {
                        // Přidáme efekt před přechodem (NOVÉ)
                        const row = document.getElementById(`endpoint-row-${index}`);
                        if (row) row.classList.add('bg-blue-100'); // Přidá modré pozadí
                    
                        // Přidáme malé zpoždění pro animaci (NOVÉ)
                        setTimeout(() => {
                          // Původní logika pro přepnutí záložky [cite: 128, 129]
                          setSelectedFieldMapping(mappingId);
                          setActiveTab('fields');
                          // Odebrání efektu po přepnutí (volitelné, pro čistotu)
                          if (row) row.classList.remove('bg-blue-100');
                        }, 200); // 200ms zpoždění
                      }
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="font-semibold">
                        {endpoint.soapOperation}
                      </div>
                      <div className="text-xs text-gray-500">
                        {endpoint.soapDescription}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      <div className="font-semibold flex items-center">
                        {endpoint.restEndpoint}
                        {endpoint.docUrl && (
                          <a
                            href={
                              endpoint.docUrl.startsWith('http')
                                ? endpoint.docUrl
                                : '#'
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            title="Otevřít dokumentaci"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {endpoint.restDescription}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {
                        apiData.categories.find(
                          (c) => c.id === endpoint.category
                        )?.description
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                       <span className="mr-2 text-sm font-medium text-blue-500">Zobrazit detail</span>
                       <ArrowRight size={16} className="text-blue-500" />
                       </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {endpoint.mainDifferences}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Obsah záložky Číselníky */}
      {activeTab === 'codelist' && (
        <div className="overflow-x-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Číselníky a referenční data
          </h2>
          <p className="mb-6 text-gray-600">
            Porovnání dostupných číselníků a referenčních dat mezi myAPI (SOAP)
            a CPL API (REST)
          </p>

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  myAPI (SOAP)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  CPL API (REST)
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Popis
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Poznámka
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {codelistEndpoints.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    Nebyly nalezeny žádné odpovídající číselníky
                  </td>
                </tr>
              ) : (
                codelistEndpoints.map((endpoint, index) => (
                  <tr
                    key={index}
                    className={
                      endpoint.soapOperation === 'N/A'
                        ? 'bg-blue-50 hover:bg-blue-100'
                        : 'hover:bg-gray-50'
                    }
                    onClick={() => {
                      // Automaticky nastaví vybranou kategorii pro záložku Porovnání polí
                      const mappingId = Object.keys(apiData.fieldMappings).find(
                        (key) => {
                          const mapping =
                            apiData.fieldMappings[
                              key as keyof typeof apiData.fieldMappings
                            ];
                          return (
                            mapping.soapOperation === endpoint.soapOperation ||
                            mapping.restEndpoint === endpoint.restEndpoint
                          );
                        }
                      );

                      if (mappingId) {
                        setSelectedFieldMapping(mappingId);
                        setActiveTab('fields');
                      }
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {endpoint.soapOperation === 'N/A' ? (
                        <span className="text-gray-400 italic">
                          Nepodporováno
                        </span>
                      ) : (
                        <div>
                          <div className="font-semibold">
                            {endpoint.soapOperation}
                          </div>
                          <div className="text-xs text-gray-500">
                            {endpoint.soapDescription}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      <div className="font-semibold flex items-center">
                        {endpoint.restEndpoint}
                        {endpoint.docUrl && (
                          <a
                            href={
                              endpoint.docUrl.startsWith('http')
                                ? endpoint.docUrl
                                : '#'
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="ml-2 text-blue-500 hover:text-blue-700"
                            title="Otevřít dokumentaci"
                          >
                            <ExternalLink size={16} />
                          </a>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {endpoint.restDescription}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {
                        apiData.categories.find(
                          (c) => c.id === endpoint.category
                        )?.description
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {endpoint.mainDifferences}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      {/* Obsah záložky Porovnání polí */}
      {activeTab === 'fields' && (
        <div>
          {!selectedFieldMapping ? (
            <div className="text-center py-8 text-gray-500">
              <p>Vyberte operaci pro zobrazení porovnání polí</p>
            </div>
          ) : (
            (() => {
              const mapping =
                apiData.fieldMappings[
                  selectedFieldMapping as keyof typeof apiData.fieldMappings
                ];

              return (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">
                      {mapping.title}
                    </h2>
                    <p className="text-gray-600">{mapping.description}</p>
                    <div className="mt-2 flex gap-8">
                      <div>
                        <span className="text-sm font-semibold text-gray-600">
                          SOAP:
                        </span>
                        <span className="text-sm ml-2 text-gray-800">
                          {mapping.soapOperation}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-600">
                          REST:
                        </span>
                        <span className="text-sm ml-2 text-blue-600 flex items-center">
                          {mapping.restEndpoint}
                          {mapping.docUrl && (
                            <a
                              href={
                                mapping.docUrl.startsWith('http')
                                  ? mapping.docUrl
                                  : '#'
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-500 hover:text-blue-700"
                              title="Otevřít dokumentaci"
                            >
                              <ExternalLink size={16} />
                            </a>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            myAPI pole
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            CPL API pole
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Datový typ
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Povinné
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Max. délka
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Popis
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredFields(selectedFieldMapping).length ===
                        0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-6 py-4 text-center text-gray-500"
                            >
                              Nebyly nalezeny žádné odpovídající pole
                            </td>
                          </tr>
                        ) : (
                          getFilteredFields(selectedFieldMapping).map(
                            (field, index) => {
                              const diff = highlightDifferences(field);
                              return (
                                <tr
                                  key={index}
                                  className={
                                    diff.hasAnyDiff
                                      ? 'bg-yellow-50 hover:bg-yellow-100'
                                      : 'hover:bg-gray-50'
                                  }
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {field.soapField}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                    {field.restField}
                                  </td>
                                  <td
                                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                                      diff.hasTypeDiff
                                        ? 'text-red-600 font-semibold'
                                        : 'text-gray-500'
                                    }`}
                                  >
                                    {field.soapType} → {field.restType}
                                  </td>
                                  <td
                                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                                      diff.hasRequiredDiff
                                        ? 'text-red-600 font-semibold'
                                        : 'text-gray-500'
                                    }`}
                                  >
                                    {field.soapRequired ? 'Ano' : 'Ne'} →{' '}
                                    {field.restRequired ? 'Ano' : 'Ne'}
                                  </td>
                                  <td
                                    className={`px-6 py-4 whitespace-nowrap text-sm ${
                                      diff.hasLengthDiff
                                        ? 'text-red-600 font-semibold'
                                        : 'text-gray-500'
                                    }`}
                                  >
                                    {field.soapLength} → {field.restLength}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-500">
                                    {field.notes}
                                  </td>
                                </tr>
                              );
                            }
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()
          )}
        </div>
      )}
      {/* Obsah záložky Obecné rozdíly */}
      {activeTab === 'differences' && (
        <div className="space-y-6">
          {apiData.generalDifferences
            .filter(
              (diff) =>
                searchTerm.trim() === '' ||
                diff.category
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                diff.soapApproach
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                diff.restApproach
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
            )
            .map((diff, index) => (
              <div
                key={index}
                className={`border rounded-lg overflow-hidden ${
                  diff.importance === 'high'
                    ? 'border-orange-300 bg-orange-50'
                    : diff.importance === 'medium'
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div
                  className="px-4 py-3 flex justify-between items-center cursor-pointer"
                  onClick={() => toggleDifference(index)}
                >
                  <h3 className="text-lg font-medium text-gray-900">
                    {diff.importance === 'high' && (
                      <span className="inline-flex items-center justify-center px-2 py-1 mr-2 text-xs font-bold leading-none text-white bg-orange-500 rounded-full">
                        Důležité
                      </span>
                    )}
                    {diff.category}
                  </h3>
                  <button className="text-gray-500 focus:outline-none">
                    {expandedDifferences.includes(index) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {expandedDifferences.includes(index) && (
                  <div className="px-4 py-3 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">
                          myAPI (SOAP)
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          {diff.soapApproach}
                        </p>
                        <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto">
                          {diff.soapExample}
                        </pre>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">
                          CPL API (REST)
                        </h4>
                        <p className="text-sm text-gray-600 mb-3">
                          {diff.restApproach}
                        </p>
                        <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto">
                          {diff.restExample}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

          {/* Sekce doporučení pro migraci */}
          <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Doporučení pro migraci
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  1. Změny v autentizaci
                </h3>
                <ul className="list-disc pl-5 text-sm text-gray-700 mt-2 space-y-1">
                  <li>
                    Implementujte OAuth2/JWT autentizaci místo přihlašovacích
                    údajů
                  </li>
                  <li>
                    Vytvořte nové autentizační komponenty pro zpracování Bearer
                    tokenů
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  2. Zpracování požadavků a odpovědí
                </h3>
                <ul className="list-disc pl-5 text-sm text-gray-700 mt-2 space-y-1">
                  <li>
                    Aktualizujte všechny názvy polí dle camelCase konvence
                  </li>
                  <li>Zkontrolujte povinná pole v nové API</li>
                  <li>Aktualizujte validace délky polí podle nových omezení</li>
                  <li>
                    Implementujte zpracování HTTP stavových kódů místo SOAP chyb
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  3. Mapování endpointů
                </h3>
                <ul className="list-disc pl-5 text-sm text-gray-700 mt-2 space-y-1">
                  <li>Přepracujte kód pro použití nových REST endpointů</li>
                  <li>Aktualizujte konstrukci URL pro strukturu REST API</li>
                  <li>
                    Implementujte správné HTTP metody (GET, POST, PUT) místo
                    SOAP operací
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Vysvětlivky pro porovnání polí */}
      {activeTab === 'fields' && selectedFieldMapping && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Info className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-700">
              Vysvětlivky:
            </span>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
            <div className="flex items-center">
              <span className="inline-block w-3 h-3 bg-yellow-50 border border-yellow-200 rounded-full mr-2"></span>
              <span>Žluté řádky označují pole s rozdíly mezi API</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block text-red-600 font-semibold mr-2">
                Červený text
              </span>
              <span>Označuje konkrétní rozdíly v parametrech</span>
            </div>
            <div className="flex items-center">
              <span className="inline-block mr-2">→</span>
              <span>Šipka symbolizuje změnu z myAPI na CPL API</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiComparison;
