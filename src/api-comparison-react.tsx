import React, { useState, useEffect, useRef } from 'react';
import LogoPPL from './assets/logo-ppl.svg';
import FaviconPPL from './assets/favicon-ppl.svg';

import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  ArrowRight,
  Check, 
  AlertCircle, 
  Copy, 
} from 'lucide-react';

// --- Typy pro Porovnávací Část ---
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

// Sloučený TabName typ zahrnující všechny záložky
type TabName = 'endpoints' | 'fields' | 'differences' | 'examples' | 'faq' | 'converter'; // | 'codelist'

// Definice typu pro endpointy
type Endpoint = {
  category: string;
  soapOperation: string;
  soapDescription: string;
  restEndpoint: string;
  restDescription: string;
  mainDifferences: string;
  docUrl: string;
};

// --- Typy pro Převodník --- 
type RestOutput = {
  success: boolean;
  error?: string;
  operation?: string;
  method?: string;
  path?: string;
  body?: any;
  queryParams?: Record<string, string | string[]>; // Nové pole pro query parametry
} | null;

// Detailnější typy pro strukturu dat v převodníku
interface SenderRecipient {
  name: string;
  name2?: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  contact?: string;
  phone?: string;
  email?: string;
}

interface CashOnDelivery {
  codCurrency?: string;
  codPrice?: number;
  codVarSym?: string;
}

interface ExternalNumber {
  code: string;
  externalNumber: string;
}

interface Service {
  code: string;
}

interface SpecificDelivery {
   parcelShopCode?: string;
}

interface Shipment {
  productType: string;
  referenceId?: string;
  note?: string;
  weight?: string | number;
  depot?: string;
  sender: SenderRecipient;
  recipient: SenderRecipient;
  shipmentSet?: { numberOfShipments: number };
  cashOnDelivery?: CashOnDelivery;
  externalNumbers?: ExternalNumber[];
  services?: Service[];
  specificDelivery?: SpecificDelivery;
}

interface Order {
    referenceId: string;
    productType: string;
    orderType: string;
    packageCount: number;
    note?: string;
    email?: string;
    date: string;
    sender: SenderRecipient;
    recipient?: SenderRecipient;
}

// Rozšířená podpora pro filtry v SOAP
interface PackageFilter {
  packNumbers?: string[];
  custRefs?: string[];
  dateFrom?: string;
  dateTo?: string;
  packageStates?: string[];
}

interface OrderFilter {
  orderNumbers?: string[];
  custRefs?: string[];
  dateFrom?: string;
  dateTo?: string;
  orderStates?: string[];
}

interface ParcelShopFilter {
  code?: string;
  countryCode?: string;
  zipCode?: string;
  city?: string;
  street?: string;
}
// Mapování REST endpointů na URL dokumentace 
const endpointDocUrls: Record<string, string> = {
  // 'GET /codelist/ageCheck': 'Číselník pro službu kontroly věku příjemce - CPL API',
  // 'GET /codelist/product': 'Číselník produktů - CPL API',
  // 'GET /codelist/externalNumber': 'https://ppl-cpl-api.apidog.io/%C4%8D%C3%ADseln%C3%ADk-typ%C5%AF-extern%C3%ADch-%C4%8D%C3%ADsel-13465891e0',
  // 'GET /codelist/country': 'https://ppl-cpl-api.apidog.io/%C4%8D%C3%ADseln%C3%ADk-zem%C3%AD-povolen%C3%AD-cod-13465892e0',
  // 'GET /codelist/currency': 'https://ppl-cpl-api.apidog.io/%C4%8D%C3%ADseln%C3%ADk-povolen%C3%BDch-m%C4%9Bn-13465893e0',
  // 'GET /codelist/service': 'https://ppl-cpl-api.apidog.io/metoda-pro-z%C3%ADsk%C3%A1n%C3%AD-poskytovan%C3%BDch-slu%C5%BEeb-k-z%C3%A1silk%C3%A1m-13465894e0',
  // 'GET /codelist/servicePriceLimit': 'https://ppl-cpl-api.apidog.io/metoda-pro-z%C3%ADsk%C3%A1n%C3%AD-minim%C3%A1ln%C3%ADch-a-maxim%C3%A1ln%C3%ADch-hodnot-u-slu%C5%BEeb-13465895e0',
  // 'GET /codelist/shipmentPhase': 'https://ppl-cpl-api.apidog.io/f%C3%A1ze-z%C3%A1silky-13465896e0',
  // 'GET /codelist/proofOfIdentityType': 'https://ppl-cpl-api.apidog.io/typy-osobn%C3%ADch-doklad%C5%AF-13465899e0',
  // 'GET /codelist/status': '',
  // 'GET /codelist/validationMessage': '',
  'GET /accessPoint': 'https://ppl-cpl-api.apidog.io/seznam-v%C3%BDdejn%C3%ADch-m%C3%ADst-13465887e0',
  'GET /addressWhisper': 'https://ppl-cpl-api.apidog.io/na%C5%A1ept%C3%A1va%C4%8D-adres-13465888e0',
  'GET /info': 'https://ppl-cpl-api.apidog.io/info-13465906e0',
  'GET /order': 'https://ppl-cpl-api.apidog.io/z%C3%ADsk%C3%A1n%C3%AD-informace-o-objedn%C3%A1vce-p%C5%99epravy-13465909e0',
  'POST /order/batch': 'https://ppl-cpl-api.apidog.io/slou%C5%BE%C3%AD-k-vytvo%C5%99en%C3%AD-objedn%C3%A1vky-odpov%C4%9B%C4%8F-je-v-header-location-13465910e0',
  'GET /order/batch/{batchId}': 'https://ppl-cpl-api.apidog.io/z%C3%ADskan%C3%AD-stavu-objednávky-13465911e0',
  'POST /order/cancel': 'https://ppl-cpl-api.apidog.io/zru%C5%A1en%C3%AD-objedn%C3%A1n%C3%AD-svozu-nebo-bal%C3%ADku-z-libovoln%C3%A9-adresy-13465912e0',
  'GET /shipment': 'https://ppl-cpl-api.apidog.io/slou%C5%BE%C3%AD-k-z%C3%ADsk%C3%A1n%C3%AD-informac%C3%AD-trackingu-k-z%C3%A1silce-13465913e0',
  'POST /shipment/batch': 'https://ppl-cpl-api.apidog.io/vytvo%C5%99en%C3%AD-z%C3%A1silky-13465914e0',
  'PUT /shipment/batch/{batchId}': 'https://ppl-cpl-api.apidog.io/slou%C5%BE%C3%AD-k-%C3%BAprav%C4%9B-v%C3%BDstupn%C3%ADho-form%C3%A1tu-%C5%A1t%C3%ADtku-13465915e0',
  'GET /shipment/batch/{batchId}': 'Získání stavu importu zásilky - CPL API',
  'GET /shipment/batch/{batchId}/label': 'Získání etikety - CPL API',
  'POST /shipment/{shipmentNumber}/cancel': 'storno zásilky - CPL API',
  'POST /shipment/{shipmentNumber}/redirect': 'úprava kontaktu - CPL API',
  'GET /versionInformation': 'informace o novinkách - CPL API',
};

type ApiDataType = {
  endpoints: any[];
  fieldMappings: Record<string, any>;
  generalDifferences: any[];
  categories: any[];
  apiExamples: any[];
  faqItems: any[];
};

// Definice dat pro API porovnání
const apiData = {
  // Kategorie (Identické v obou souborech)
  categories: [
    { id: 'shipment', name: 'Zásilky', description: 'Vytvoření a sledování zásilek' },
    { id: 'order', name: 'Objednávky', description: 'Správa objednávek přepravy' },
    { id: 'accesspoint', name: 'Výdejní místa', description: 'Práce s výdejními místy' },
   // { id: 'codelist', name: 'Číselníky', description: 'Referenční data a číselníky' }, // codelist
    { id: 'auth', name: 'Autentizace', description: 'Přihlášení a autorizace' },
  ],
  // Mapování endpointů (Sloučeno z obou souborů, používá endpointDocUrls)
  endpointMappings: [
    // Zásilky
    { category: 'shipment', soapOperation: 'CreatePackages', soapDescription: 'Vloží nové zásilky pro import a vytvoří štítky', restEndpoint: 'POST /shipment/batch', restDescription: 'Slouží k vytvoření zásilky a získání štítků', mainDifferences: 'REST API poskytuje více validačních pravidel, má jiný formát odpovědi a používá camelCase', docUrl: endpointDocUrls['POST /shipment/batch'] },
    { category: 'shipment', soapOperation: 'GetPackages', soapDescription: 'Vrátí seznam zásilek dle zadaného filtru', restEndpoint: 'GET /shipment', restDescription: 'Slouží k získání informací (trackingu) k zásilce', mainDifferences: 'REST API používá query parametry místo komplexního filtru v těle', docUrl: endpointDocUrls['GET /shipment'] },
    { category: 'shipment', soapOperation: 'CancelPackage', soapDescription: 'Zrušení zásilky', restEndpoint: 'POST /shipment/{shipmentNumber}/cancel', restDescription: 'Možnost stornovat balík, pokud nebyl fyzicky poslán', mainDifferences: 'REST API využívá URL parametr pro identifikaci zásilky', docUrl: endpointDocUrls['POST /shipment/{shipmentNumber}/cancel'] },
    { category: 'shipment', soapOperation: 'UpdatePackage', soapDescription: 'Aktualizace údajů zásilky', restEndpoint: 'POST /shipment/{shipmentNumber}/redirect', restDescription: 'Možnost doplnit informace k balíku', mainDifferences: 'REST API poskytuje omezenější možnosti aktualizace', docUrl: endpointDocUrls['POST /shipment/{shipmentNumber}/redirect'] },
    // Objednávky
    { category: 'order', soapOperation: 'CreateOrders', soapDescription: 'Vytvoří objednávky přepravy s doručením na adresu příjemce', restEndpoint: 'POST /order/batch', restDescription: 'Slouží k vytvoření objednávky doručení', mainDifferences: 'V REST API je typ objednávky určen parametrem orderType="transportOrder" a obsahuje údaje o příjemci', docUrl: endpointDocUrls['POST /order/batch'] },
    { category: 'order', soapOperation: 'CreatePickupOrders', soapDescription: 'Vytvoří objednávky svozu bez doručení', restEndpoint: 'POST /order/batch', restDescription: 'Slouží k vytvoření objednávky svozu', mainDifferences: 'V REST API je typ objednávky určen parametrem orderType="collectionOrder" a NEOBSAHUJE údaje o příjemci', docUrl: endpointDocUrls['POST /order/batch'] },
    { category: 'order', soapOperation: 'GetOrders', soapDescription: 'Vrátí seznam objednávek dle zadaného filtru', restEndpoint: 'GET /order', restDescription: 'Sledování stavu objednávek', mainDifferences: 'REST API používá query parametry místo komplexního filtru v těle', docUrl: endpointDocUrls['GET /order'] },
    { category: 'order', soapOperation: 'CancelOrder', soapDescription: 'Zrušení objednávky', restEndpoint: 'POST /order/cancel', restDescription: 'Zrušení objednání svozu nebo balíku z libovolné adresy', mainDifferences: 'REST API používá query parametry pro identifikaci objednávky', docUrl: endpointDocUrls['POST /order/cancel'] },
    // Výdejní místa
    { category: 'accesspoint', soapOperation: 'GetParcelShops', soapDescription: 'Vrátí seznam ParcelShopů', restEndpoint: 'GET /accessPoint', restDescription: 'Seznam výdejních míst', mainDifferences: 'REST API má rozšířené možnosti filtrování a detailnější strukturu', docUrl: endpointDocUrls['GET /accessPoint'] },
    // Přidáno z file 2, nebylo v file 1 explicitně
    { category: 'address', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /addressWhisper', restDescription: 'Našeptávač adres', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /addressWhisper'] },
    // Přidáno z file 2, nebylo v file 1 explicitně
    { category: 'info', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /info', restDescription: 'Info', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /info'] },
    { category: 'version', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /versionInformation', restDescription: 'Informace o novinkách', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /versionInformation'] },
    // Codelist - číselníky služeb
    // { category: 'codelist', soapOperation: 'GetCodCurrency', soapDescription: 'Vrátí povolené měny pro dobírku', restEndpoint: 'GET /codelist/currency', restDescription: 'Číselník povolených měn', mainDifferences: 'REST API používá standardizovaný formát pro všechny číselníky', docUrl: endpointDocUrls['GET /codelist/currency'] },
    // { category: 'codelist', soapOperation: 'GetPackProducts', soapDescription: 'Vrátí seznam produktů', restEndpoint: 'GET /codelist/product', restDescription: 'Číselník produktů', mainDifferences: 'REST API používá standardizovaný formát pro všechny číselníky', docUrl: endpointDocUrls['GET /codelist/product'] },
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/ageCheck', restDescription: 'Číselník pro službu kontroly věku příjemce', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/ageCheck'] },
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/externalNumber', restDescription: 'Číselník typů externích čísel', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/externalNumber'] },
    // { category: 'codelist', soapOperation: 'GetProductCountry', soapDescription: 'Vrátí země a produkty pro zákazníka', restEndpoint: 'GET /codelist/country', restDescription: 'Číselník zemí + povolení COD', mainDifferences: 'REST API poskytuje jednodušší strukturu', docUrl: endpointDocUrls['GET /codelist/country'] },
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/service', restDescription: 'Metoda pro získání poskytovaných služeb k zásilkám', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/service'] },
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/servicePriceLimit', restDescription: 'Metoda pro získání minimálních a maximálních hodnot u služeb', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/servicePriceLimit'] },
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/shipmentPhase', restDescription: 'Fáze zásilky', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/shipmentPhase'] },
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/status', restDescription: 'Statusy zásilky /shipment', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/status'] }, // URL chybí i v file 2 [cite: 215]
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/validationMessage', restDescription: 'Chybové hlášení', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/validationMessage'] }, // URL chybí i v file 2 [cite: 215]
    // { category: 'codelist', soapOperation: 'N/A', soapDescription: 'Nepodporováno v SOAP', restEndpoint: 'GET /codelist/proofOfIdentityType', restDescription: 'Typy osobních dokladů', mainDifferences: 'Dostupné pouze v REST API', docUrl: endpointDocUrls['GET /codelist/proofOfIdentityType'] },
    // Autentizace (Identické v obou souborech) [cite: 30, 217]
    { category: 'auth', soapOperation: 'Login', soapDescription: 'Vrátí autentikační ticket', restEndpoint: 'OAuth2/JWT autentizace', restDescription: 'Standardní autentizace pomocí Bearer tokenu', mainDifferences: 'REST API používá standardní OAuth2/JWT mechanismus místo vlastního', docUrl: endpointDocUrls['auth-login'] || '' },
  ], // <-- Konec endpointMappings
  fieldMappings: {
    // Zásilka - Vytvoření
    'shipment-create': {
      title: 'Vytvoření zásilky', description: 'Porovnání struktur pro vytvoření zásilky', soapOperation: 'CreatePackages', restEndpoint: 'POST /shipment/batch', docUrl: endpointDocUrls['POST /shipment/batch'],
      fields: [
        // Všechna pole z file 2 pro shipment-create
        { soapField: 'PackNumber', restField: 'shipmentNumber', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Číslo zásilky (systémové)' },
        { soapField: 'PackRef', restField: 'referenceId', soapType: 'string', restType: 'string', soapRequired: false, restRequired: true, soapLength: '50', restLength: '50', notes: 'Číslo zásilky (zákaznické)' },
        { soapField: 'PackProductType', restField: 'productType', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Typ produktu (např. BUSS)' },
        { soapField: 'Note', restField: 'note', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '300', notes: 'Poznámka k zásilce' },
        { soapField: 'Weight', restField: 'weight', soapType: 'string', restType: 'number', soapRequired: true, restRequired: false, soapLength: 'Neomezeno', restLength: 'N/A', notes: 'Hmotnost zásilky' },
        { soapField: 'DepoCode', restField: 'depot', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '2', notes: 'Kód depa' },
        { soapField: 'Sender.Name', restField: 'sender.name', soapType: 'string', restType: 'string', soapRequired: true, restRequired: false, soapLength: 'Neomezeno', restLength: '50', notes: 'Jméno odesílatele' },
        { soapField: 'Sender.Name2', restField: 'sender.name2', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '50', notes: 'Doplňující jméno odesílatele' },
        { soapField: 'Sender.Street', restField: 'sender.street', soapType: 'string', restType: 'string', soapRequired: true, restRequired: false, soapLength: 'Neomezeno', restLength: '60', notes: 'Ulice odesílatele' },
        { soapField: 'Sender.City', restField: 'sender.city', soapType: 'string', restType: 'string', soapRequired: true, restRequired: false, soapLength: 'Neomezeno', restLength: '50', notes: 'Město odesílatele' },
        { soapField: 'Sender.ZipCode', restField: 'sender.zipCode', soapType: 'string', restType: 'string', soapRequired: true, restRequired: false, soapLength: 'Neomezeno', restLength: '10', notes: 'PSČ odesílatele' },
        { soapField: 'Sender.Country', restField: 'sender.country', soapType: 'string', restType: 'string', soapRequired: true, restRequired: false, soapLength: 'Neomezeno', restLength: '2', notes: 'Země odesílatele (ISO kód)' },
        { soapField: 'Sender.Contact', restField: 'sender.contact', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '50', notes: 'Kontaktní osoba odesílatele' },
        { soapField: 'Sender.Phone', restField: 'sender.phone', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '50', notes: 'Telefon odesílatele' },
        { soapField: 'Sender.Email', restField: 'sender.email', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '100', notes: 'Email odesílatele' },
        { soapField: 'Recipient.Name', restField: 'recipient.name', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '50', notes: 'Jméno příjemce' },
        { soapField: 'Recipient.Name2', restField: 'recipient.name2', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '50', notes: 'Doplňující jméno příjemce' },
        { soapField: 'Recipient.Street', restField: 'recipient.street', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '60', notes: 'Ulice příjemce' },
        { soapField: 'Recipient.City', restField: 'recipient.city', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '50', notes: 'Město příjemce' },
        { soapField: 'Recipient.ZipCode', restField: 'recipient.zipCode', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '10', notes: 'PSČ příjemce' },
        { soapField: 'Recipient.Country', restField: 'recipient.country', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '2', notes: 'Země příjemce (ISO kód)' },
        { soapField: 'Recipient.Contact', restField: 'recipient.contact', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '50', notes: 'Kontaktní osoba příjemce' },
        { soapField: 'Recipient.Phone', restField: 'recipient.phone', soapType: 'string', restType: 'string', soapRequired: false, restRequired: true, soapLength: 'Neomezeno', restLength: '50', notes: 'Telefon příjemce (v REST povinný)' },
        { soapField: 'Recipient.Email', restField: 'recipient.email', soapType: 'string', restType: 'string', soapRequired: false, restRequired: true, soapLength: 'Neomezeno', restLength: '100', notes: 'Email příjemce (v REST povinný)' },
        { soapField: 'PaymentInfo.CodCurrency', restField: 'cashOnDelivery.codCurrency', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '3', notes: 'Měna dobírky' },
        { soapField: 'PaymentInfo.CodPrice', restField: 'cashOnDelivery.codPrice', soapType: 'string', restType: 'number', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: 'N/A', notes: 'Částka dobírky' },
        { soapField: 'PaymentInfo.CodVarSym', restField: 'cashOnDelivery.codVarSym', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '10', notes: 'Variabilní symbol dobírky' },
        { soapField: 'SpecDelivery.ParcelShopCode', restField: 'specificDelivery.parcelShopCode', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '20', notes: 'Kód výdejního místa (ParcelShopu)' },
        { soapField: 'PackagesExtNums.ExtNumber', restField: 'externalNumbers[].externalNumber', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '50', notes: 'Externí číslo (REST: nutno specifikovat i code např. CUST)' },
        { soapField: 'AgeVerification', restField: 'services[].code', soapType: 'boolean', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'N/A', restLength: 'Neomezeno', notes: 'Kontrola věku (REST: hodnota "AGE_VERIFICATION")' },
      ]
    },
 // Zásilka - Sledování
 'tracking': {
  title: 'Sledování zásilky', description: 'Porovnání struktur pro získání informací o zásilce', soapOperation: 'GetPackages', restEndpoint: 'GET /shipment', docUrl: endpointDocUrls['GET /shipment'],
  fields: [ // Pole z file 2
    { soapField: 'Filter.PackNumbers[]', restField: 'ShipmentNumbers[] (query param)', soapType: 'string[]', restType: 'string[]', soapRequired: false, restRequired: false, soapLength: 'Max 50 položek', restLength: 'Max 50 položek', notes: 'Čísla zásilek (v REST jako query parametr)' },
    { soapField: 'Filter.CustRefs[]', restField: 'CustomerReferences[] (query param)', soapType: 'string[]', restType: 'string[]', soapRequired: false, restRequired: false, soapLength: 'Max 50 položek', restLength: 'Max 50 položek', notes: 'Reference zákazníka (v REST jako query parametr)' },
    { soapField: 'Filter.DateFrom', restField: 'DateFrom (query param)', soapType: 'dateTime', restType: 'dateTime', soapRequired: false, restRequired: false, soapLength: 'N/A', restLength: 'N/A', notes: 'Počáteční datum rozsahu (v REST jako query parametr)' },
    { soapField: 'Filter.DateTo', restField: 'DateTo (query param)', soapType: 'dateTime', restType: 'dateTime', soapRequired: false, restRequired: false, soapLength: 'N/A', restLength: 'N/A', notes: 'Koncové datum rozsahu (v REST jako query parametr)' },
    { soapField: 'Filter.PackageStates', restField: 'ShipmentStates (query param)', soapType: 'enum', restType: 'enum', soapRequired: false, restRequired: false, soapLength: 'N/A', restLength: 'N/A', notes: 'Stavy zásilek (v REST jako query parametr)' },
    { soapField: 'PackNumber (odpověď)', restField: 'shipmentNumber (odpověď)', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Číslo zásilky v odpovědi' },
  ]
},
'pickup-order-create': {
  title: 'Vytvoření objednávky svozu (bez příjemce)', 
  description: 'Porovnání struktur pro vytvoření objednávky svozu', 
  soapOperation: 'CreatePickupOrders', 
  restEndpoint: 'POST /order/batch', 
  docUrl: endpointDocUrls['POST /order/batch'],
  fields: [ 
    { soapField: 'OrdRefId', restField: 'referenceId', soapType: 'string', restType: 'string', soapRequired: false, restRequired: true, soapLength: 'Neomezeno', restLength: '50', notes: 'Reference objednávky' },
    { soapField: 'PackProductType', restField: 'productType', soapType: 'string', restType: 'string', soapRequired: true, restRequired: false, soapLength: 'Neomezeno', restLength: '4', notes: 'Typ produktu' },
    { soapField: 'CountPack', restField: 'packageCount', soapType: 'int', restType: 'integer', soapRequired: true, restRequired: true, soapLength: 'N/A', restLength: 'N/A', notes: 'Počet balíků' },
    { soapField: 'SendDate', restField: 'date', soapType: 'dateTime', restType: 'string (date)', soapRequired: true, restRequired: true, soapLength: 'N/A', restLength: 'YYYY-MM-DD', notes: 'Datum odeslání/vyzvednutí' },
    { soapField: 'Note', restField: 'note', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '300', notes: 'Poznámka k objednávce' },
    { soapField: 'Email', restField: 'email', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '100', notes: 'Kontaktní email objednávky' },
    { soapField: 'Sender.Name', restField: 'sender.name', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '50', notes: 'Jméno odesílatele' },
    { soapField: 'Sender.Street', restField: 'sender.street', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '60', notes: 'Ulice odesílatele' },
    { soapField: 'Sender.City', restField: 'sender.city', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '50', notes: 'Město odesílatele' },
    { soapField: 'Sender.ZipCode', restField: 'sender.zipCode', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '10', notes: 'PSČ odesílatele' },
    { soapField: 'Sender.Country', restField: 'sender.country', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '2', notes: 'Země odesílatele' },
    { soapField: 'Sender.Phone', restField: 'sender.phone', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '50', notes: 'Telefon odesílatele' },
    { soapField: 'Sender.Email', restField: 'sender.email', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '100', notes: 'Email odesílatele' }
  ]
},

 // Objednávka - Vytvoření
 'order-create': {
  title: 'Vytvoření objednávky přepravy', 
  description: 'Porovnání struktur pro vytvoření objednávky doručení', 
  soapOperation: 'CreateOrders',
  restEndpoint: 'POST /order/batch',
  docUrl: endpointDocUrls['POST /order/batch'],
  fields: [ 
    { soapField: 'OrdRefId', restField: 'referenceId', soapType: 'string', restType: 'string', soapRequired: false, restRequired: true, soapLength: 'Neomezeno', restLength: '50', notes: 'Reference objednávky' },
    { soapField: 'PackProductType', restField: 'productType', soapType: 'string', restType: 'string', soapRequired: true, restRequired: false, soapLength: 'Neomezeno', restLength: '4', notes: 'Typ produktu' },
    { soapField: 'CountPack', restField: 'packageCount', soapType: 'int', restType: 'integer', soapRequired: true, restRequired: true, soapLength: 'N/A', restLength: 'N/A', notes: 'Počet balíků' },
    { soapField: 'SendDate', restField: 'date', soapType: 'dateTime', restType: 'string (date)', soapRequired: true, restRequired: true, soapLength: 'N/A', restLength: 'YYYY-MM-DD', notes: 'Datum odeslání/vyzvednutí' },
    { soapField: 'Note', restField: 'note', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '300', notes: 'Poznámka k objednávce' },
    { soapField: 'Email', restField: 'email', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '100', notes: 'Kontaktní email objednávky' },
    { soapField: 'Sender.Name', restField: 'sender.name', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '50', notes: 'Jméno odesílatele' },
    { soapField: 'Sender.Street', restField: 'sender.street', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '60', notes: 'Ulice odesílatele' },
    { soapField: 'Sender.City', restField: 'sender.city', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '50', notes: 'Město odesílatele' },
    { soapField: 'Sender.ZipCode', restField: 'sender.zipCode', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '10', notes: 'PSČ odesílatele' },
    { soapField: 'Sender.Country', restField: 'sender.country', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '2', notes: 'Země odesílatele' },
    { soapField: 'Sender.Phone', restField: 'sender.phone', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '50', notes: 'Telefon odesílatele' },
    { soapField: 'Sender.Email', restField: 'sender.email', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '100', notes: 'Email odesílatele' },
    
    { soapField: 'Recipient.Name', restField: 'recipient.name', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '50', notes: 'Jméno příjemce' },
    { soapField: 'Recipient.Street', restField: 'recipient.street', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '60', notes: 'Ulice příjemce' },
    { soapField: 'Recipient.City', restField: 'recipient.city', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '50', notes: 'Město příjemce' },
    { soapField: 'Recipient.ZipCode', restField: 'recipient.zipCode', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '10', notes: 'PSČ příjemce' },
    { soapField: 'Recipient.Country', restField: 'recipient.country', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '2', notes: 'Země příjemce' },
    { soapField: 'Recipient.Phone', restField: 'recipient.phone', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '50', notes: 'Telefon příjemce' },
    { soapField: 'Recipient.Email', restField: 'recipient.email', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '100', notes: 'Email příjemce' }
  ]
},
// Výdejní místa - Získání
'accesspoint-get': {
    title: 'Výdejní místa', description: 'Porovnání struktur pro získání informací o výdejních místech', soapOperation: 'GetParcelShops', restEndpoint: 'GET /accessPoint', docUrl: endpointDocUrls['GET /accessPoint'],
    fields: [ // Pole z file 2
        { soapField: 'Filter.Code', restField: 'AccessPointCode (query param)', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Kód výdejního místa' },
        { soapField: 'Filter.CountryCode', restField: 'CountryCode (query param)', soapType: 'string', restType: 'string', soapRequired: true, restRequired: false, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Kód země' },
        { soapField: 'Filter.ZipCode', restField: 'ZipCode (query param)', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'PSČ' },
        { soapField: 'Filter.City', restField: 'City (query param)', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Město (REST only)' },
        { soapField: 'Filter.Street', restField: 'Street (query param)', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Ulice (REST only)' },
        { soapField: 'Result.AccessPointCode', restField: 'accessPointCode (odpověď)', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Kód výdejního místa v odpovědi' },
    ]
},

// Číselník - Měny
// 'codelist-currency': {
//   title: 'Číselník měn', description: 'Porovnání struktur pro získání seznamu povolených měn', soapOperation: 'GetCodCurrency', restEndpoint: 'GET /codelist/currency', docUrl: endpointDocUrls['GET /codelist/currency'],
//   fields: [ 
//     { soapField: 'CurrencyCode', restField: 'code', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '3', notes: 'Kód měny' },
//     { soapField: 'CurrencyName', restField: 'name', soapType: 'string', restType: 'string', soapRequired: false, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Název měny' },
//    ]
// },
// // Číselník - Produkty
// 'codelist-product': {
//     title: 'Číselník produktů', description: 'Porovnání struktur pro získání seznamu produktů', soapOperation: 'GetPackProducts', restEndpoint: 'GET /codelist/product', docUrl: endpointDocUrls['GET /codelist/product'],
//     fields: [ // Pole z file 2
//         { soapField: 'ProductCode', restField: 'code', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '4', notes: 'Kód produktu' },
//         { soapField: 'ProductName', restField: 'name', soapType: 'string', restType: 'string', soapRequired: false, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Název produktu' },
//         { soapField: 'ProductDesc', restField: 'description', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Popis produktu' },
//     ]
// },
// // Číselník - Země
// 'codelist-country': {
//     title: 'Číselník zemí', description: 'Porovnání struktur pro získání seznamu zemí', soapOperation: 'GetProductCountry', restEndpoint: 'GET /codelist/country', docUrl: endpointDocUrls['GET /codelist/country'],
//     fields: [ // Pole z file 2
//         { soapField: 'CountryCode', restField: 'code', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: '2', notes: 'Kód země' },
//         { soapField: 'CountryName', restField: 'name', soapType: 'string', restType: 'string', soapRequired: false, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Název země' },
//         { soapField: 'IsCODAllowed', restField: 'isCodAllowed', soapType: 'boolean', restType: 'boolean', soapRequired: false, restRequired: true, soapLength: 'N/A', restLength: 'N/A', notes: 'Povolení dobírky' },
//     ]
// },

// Objednávka - Sledování
'order-get': {
    title: 'Sledování objednávek', description: 'Porovnání struktur pro získání informací o objednávkách', soapOperation: 'GetOrders', restEndpoint: 'GET /order', docUrl: endpointDocUrls['GET /order'],
    fields: [ // Pole z file 2
        { soapField: 'Filter.OrderNumbers[]', restField: 'OrderNumbers[] (query param)', soapType: 'string[]', restType: 'string[]', soapRequired: false, restRequired: false, soapLength: 'Max 50 položek', restLength: 'Max 50 položek', notes: 'Čísla objednávek' },
        { soapField: 'Filter.CustRefs[]', restField: 'CustomerReferences[] (query param)', soapType: 'string[]', restType: 'string[]', soapRequired: false, restRequired: false, soapLength: 'Max 50 položek', restLength: 'Max 50 položek', notes: 'Reference zákazníka' },
        { soapField: 'Result.OrderNumber', restField: 'orderNumber (odpověď)', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Číslo objednávky v odpovědi' },
        // ... další pole odpovědi
    ]
},
// Zásilka - Zrušení
'shipment-cancel': {
    title: 'Zrušení zásilky', description: 'Porovnání struktur pro zrušení zásilky', soapOperation: 'CancelPackage', restEndpoint: 'POST /shipment/{shipmentNumber}/cancel', docUrl: endpointDocUrls['POST /shipment/{shipmentNumber}/cancel'],
    fields: [ // Pole z file 2
        { soapField: 'PackNumber', restField: 'shipmentNumber (v URL)', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Číslo zásilky (v REST API je součástí URL)' },
        { soapField: 'Note', restField: 'note (body)', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '300', notes: 'Poznámka ke zrušení zásilky (v REST API v těle požadavku)' },
        { soapField: 'ResultStatus', restField: 'HTTP status kód', soapType: 'string', restType: 'integer', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: 'N/A', notes: 'Výsledek operace (v REST API reprezentováno HTTP stavovým kódem)' },
        { soapField: 'ResultMessage', restField: 'message (v těle odpovědi)', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Popis výsledku operace (v REST API v těle odpovědi)' },
    ]
},
// Zásilka - Přesměrování/Úprava
'shipment-redirect': {
    title: 'Úprava kontaktu zásilky', description: 'Porovnání struktur pro aktualizaci/přesměrování zásilky', soapOperation: 'UpdatePackage', restEndpoint: 'POST /shipment/{shipmentNumber}/redirect', docUrl: endpointDocUrls['POST /shipment/{shipmentNumber}/redirect'],
    fields: [ // Pole z file 2 + doplnění
        { soapField: 'PackNumber', restField: 'shipmentNumber (v URL)', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Číslo zásilky (v REST API je součástí URL)' },
        { soapField: 'N/A', restField: 'recipientContact.phone', soapType: 'N/A', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'N/A', restLength: '50', notes: 'Nový telefon příjemce (REST only)' },
        { soapField: 'N/A', restField: 'recipientContact.email', soapType: 'N/A', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'N/A', restLength: '100', notes: 'Nový email příjemce (REST only)' },
        { soapField: 'N/A', restField: 'note', soapType: 'N/A', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'N/A', restLength: '300', notes: 'Poznámka (REST only)' },
    ]
},
// Objednávka - Zrušení
'order-cancel': {
    title: 'Zrušení objednávky', description: 'Porovnání struktur pro zrušení objednávky', soapOperation: 'CancelOrder', restEndpoint: 'POST /order/cancel', docUrl: endpointDocUrls['POST /order/cancel'],
    fields: [ // Pole z file 2
        { soapField: 'OrderNumber', restField: 'orderNumber (query param)', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Číslo objednávky (v REST jako query parametr)' },
        { soapField: 'CustRef', restField: 'customerReference (query param)', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '40', notes: 'Reference zákazníka (v REST jako query parametr)' },
        { soapField: 'Note', restField: 'note (query param)', soapType: 'string', restType: 'string', soapRequired: false, restRequired: false, soapLength: 'Neomezeno', restLength: '300', notes: 'Poznámka ke zrušení objednávky (v REST jako query parametr)' },
        { soapField: 'ResultStatus', restField: 'HTTP status kód', soapType: 'string', restType: 'integer', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: 'N/A', notes: 'Výsledek operace (v REST API reprezentováno HTTP stavovým kódem)' },
    ]
},
// Autentizace - Login
'auth-login': {
    title: 'Autentizace', description: 'Porovnání struktur pro autentizaci', soapOperation: 'Login', restEndpoint: 'OAuth2/JWT autentizace', docUrl: endpointDocUrls['auth-login'] || '',
    fields: [ // Pole z file 2
        { soapField: 'Username', restField: 'client_id', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Uživatelské jméno / ID klienta' },
        { soapField: 'Password', restField: 'client_secret', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Heslo / Tajný klíč klienta' },
        { soapField: 'AuthToken (odpověď)', restField: 'access_token (odpověď)', soapType: 'string', restType: 'string', soapRequired: true, restRequired: true, soapLength: 'Neomezeno', restLength: 'Neomezeno', notes: 'Autentizační token v odpovědi' },
    ]
},
}, // <-- Konec fieldMappings
generalDifferences: [
  { category: 'Autentizace', soapApproach: 'Vlastní autentizační model s přihlašovacími údaji v Auth elementu:', soapExample: '<Auth>\n  <UserName>username</UserName>\n  <Password>password</Password>\n  \n  <AuthToken>token</AuthToken>\n</Auth>', restApproach: 'Standardní OAuth2 nebo JWT autentizace:', restExample: 'Authorization: Bearer {token}', importance: 'high' },
  { category: 'Konvence pojmenování', soapApproach: 'PascalCase konvence', soapExample: 'PackNumber, RecipientName', restApproach: 'camelCase konvence', restExample: 'shipmentNumber, recipientName', importance: 'medium' },
  { category: 'Formát požadavků a odpovědí', soapApproach: 'XML struktura s SOAP obálkou', soapExample: '<soapenv:Envelope>...</soapenv:Envelope>', restApproach: 'JSON struktura', restExample: '{ "shipments": [...] }', importance: 'high' },
  { category: 'Komunikační model', soapApproach: 'RPC model s operacemi', soapExample: 'CreatePackages', restApproach: 'Resourceový model s HTTP metodami', restExample: 'POST /shipment/batch', importance: 'high' },
  { category: 'Zpracování chyb', soapApproach: 'SOAP Fault struktury', soapExample: '<soapenv:Fault>...</soapenv:Fault>', restApproach: 'HTTP stavové kódy s JSON chybovými objekty', restExample: '{ "status": 400, "detail": "...", "errors": {...} }', importance: 'high' },
  { category: 'Limity délky polí', soapApproach: 'Většinou bez explicitního omezení', soapExample: 'Note, Street', restApproach: 'Explicitní definice maximálních délek', restExample: 'note: max 300, street: max 60', importance: 'high' },
  { category: 'Stránkování', soapApproach: 'Stránkování pomocí komplexních filtrů', soapExample: 'Filter struktura', restApproach: 'Standardní stránkování pomocí Limit a Offset', restExample: '?Limit=100&Offset=0 s hlavičkami X-Paging-*', importance: 'medium' },
  { category: 'Dokumentace', soapApproach: 'WSDL soubor s XML schématem', soapExample: '<wsdl:definitions>...</wsdl:definitions>', restApproach: 'OpenAPI (Swagger) specifikace', restExample: '{ "openapi": "3.0.1", ... }', importance: 'medium' },

  // záložka - kategorie číselníky
  // { category: 'Číselníky', soapApproach: 'Omezený počet samostatných operací', soapExample: 'GetCodCurrency', restApproach: 'Jednotný přístup přes /codelist/*', restExample: 'GET /codelist/currency', importance: 'high' },
  // Ujistěte se, že za posledním rozdílem NENÍ čárka
], // <-- Konec generalDifferences
apiExamples: [
  {
    id: 'multi-package-shipment', 
    title: 'Více zásilek s individuálními váhami a čísly', 
    description: 'Komplexní příklad se sadou zásilek, kde každá zásilka má vlastní váhu a vlastní jedinečná externí čísla', 
    endpoint: '/shipment/batch', 
    method: 'POST',
    requestBody: `{
  "returnChannel": {
    "type": "Email",
    "address": "jfnukal@elinkx.cz"
  },
  "labelSettings": {
    "format": "ZPL",
    "dpi": 300,
    "completeLabelSettings": {
      "isCompleteLabelRequested": true,
      "pageSize": "A4",
      "position": 1
    }
  },
  "shipments": [
    {
      "referenceId": "Reference03",
      "productType": "CONN",
      "note": "Poznamka",
      "integratorId": "422609",
      
      "shipmentSet": {
        "numberOfShipments": 3,
        "shipmentSetItems": [
          {
            "weighedShipmentInfo": {
              "weight": 1.5
            },
            "externalNumbers": [
              { 
                "externalNumber": "Ext_Box1_CUST", 
                "code": "CUST"
              }
            ]
          },
          {
            "weighedShipmentInfo": {
              "weight": 3.2
            },
            "externalNumbers": [
              { 
                "externalNumber": "Ext_Box2_CUST", 
                "code": "CUST"
              },
              { 
                "externalNumber": "B2CO_000222", 
                "code": "B2CO"
              }
            ]
          },
          {
            "weighedShipmentInfo": {
              "weight": 5.8
            },
            "externalNumbers": [
              { 
                "externalNumber": "Ext_Box3_CUST", 
                "code": "CUST"
              },
              { 
                "externalNumber": "B2CO_000333", 
                "code": "B2CO"
              },
              { 
                "externalNumber": "ESHOP_999", 
                "code": "VARS"
              }
            ]
          }
        ]
      },
      
      "sender": {
        "name": "Name sender",
        "street": "Street sender 99",
        "city": "Olomouc",
        "zipCode": "77200",
        "country": "CZ",
        "contact": "Contact sender",
        "phone": "+420777999888",
        "email": "test@test.cz"
      },
      
      "recipient": {
        "name": "Recipient Gunter",
        "street": "Janosika 22",
        "city": "Zilina",
        "zipCode": "01001",
        "country": "SK",
        "contact": "Recipient Kontakte",
        "phone": "+49777888999",
        "email": "recipient@example.sk"
      },
      
      "insurance": {
        "insurancePrice": "156000",
        "insuranceCurrency": "CZK"
      },
      
      "dormant": {
        "note": "Poznamka return",
        "depot": "07",
        "recipient": {
          "name": "Name return",
          "street": "Street return 99",
          "city": "Olomouc",
          "zipCode": "77200",
          "country": "CZ",
          "contact": "Contact return",
          "phone": "+420777999888",
          "email": "test@test.cz"
        },
        "services": [
          {
            "code": "PUBC"
          }
        ]
      }
    }
  ]
}`,
    complexity: 'complex', 
    category: 'Zásilky'
  },
  {
    id: 'individual-insurance', 
    title: 'Zásilky s individuálním pojištěním', 
    description: 'Příklad sady zásilek, kde každá zásilka má vlastní váhu a vlastní pojistnou částku', 
    endpoint: '/shipment/batch', 
    method: 'POST',
    requestBody: `{
  "returnChannel": {
    "type": "Email",
    "address": "mkaisersat@ppl.cz"
  },
  "labelSettings": {
    "format": "Pdf",
    "dpi": 600,
    "completeLabelSettings": {
      "isCompleteLabelRequested": true,
      "pageSize": "A4",
      "position": 2
    }
  },
  "shipments": [
    {
      "referenceId": "123456a4",
      "productType": "CONN",
      "note": "poznamka",
      "depot": "07",
      "shipmentSet": {
        "numberOfShipments": 2,
        "shipmentSetItems": [
          {
            "weighedShipmentInfo": {
              "weight": 1
            },
            "insurance": {
              "insurancePrice": 100000.01,
              "insuranceCurrency": "CZK"
            }
          },
          {
            "weighedShipmentInfo": {
              "weight": 2
            },
            "insurance": {
              "insurancePrice": 200000,
              "insuranceCurrency": "CZK"
            }
          }
        ]
      },
      "sender": {
        "name": "Pavel Peknica",
        "street": "Vysni Lhoty 222",
        "city": "Dobrá",
        "zipCode": "73951",
        "country": "CZ",
        "phone": "123654789",
        "email": "pavel@peca.cz"
      },
      "recipient": {
        "name": "Lukáš Richter",
        "street": "Nové Dvory-Podhůří 3844",
        "city": "Berlin",
        "zipCode": "10112",
        "country": "DE",
        "phone": "369852147",
        "email": "pavel@peca.cz"
      }
    }
  ]
}`,
    complexity: 'complex', 
    category: 'Zásilky'
  }
], // <-- Konec apiExamples
faqItems: [
  { id: 'auth-how', question: 'Jak se přihlásit k API?', answer: 'Pro přihlášení k CPL API je potřeba použít OAuth2 autentizaci. Volání probíhá pomocí client_id a client_secret, které získáte od PPL. Autentizace se provádí na endpointu /login/getAccessToken a vrátí vám JWT token, který následně používáte v hlavičce Authorization: Bearer {token} pro všechna další API volání.', category: 'Autentizace' },
  { id: 'shipment-create', question: 'Jak vytvořit zásilku?', answer: 'Pro vytvoření zásilky použijte metodu POST na endpoint /shipment/batch. V požadavku musíte specifikovat informace o odesílateli, příjemci, typu produktu, počtu balíků a dalších parametrech zásilky. Po úspěšném vytvoření získáte identifikátor dávky, pomocí kterého můžete stáhnout štítky nebo zjistit stav importu zásilky.', category: 'Zásilky' },
  // Můžete přidat další FAQ...
  // Ujistěte se, že za posledním FAQ NENÍ čárka
] // <-- Konec faqItems, ŽÁDNÁ ČÁRKA NÁSLEDUJE
}; // <-- Konec apiData

const ApiComparisonConverter: React.FC = () => {
  // State pro porovnávací část (sloučeno z obou)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedFieldMapping, setSelectedFieldMapping] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabName>('endpoints');
  const [expandedDifferences, setExpandedDifferences] = useState<number[]>([]);
  const [copiedButtonId, setCopiedButtonId] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: '0px', width: '0px' });

  // State pro převodníkovou část
  const [soapInput, setSoapInput] = useState('');
  const [restOutput, setRestOutput] = useState<RestOutput>(null);
  const [converterBaseUrl, setConverterBaseUrl] = useState('https://api.dhl.com/ecs/ppl/myapi2');

  // Reference pro záložky
  const tabRefs = {
    endpoints: useRef<HTMLButtonElement>(null),
    fields: useRef<HTMLButtonElement>(null),
  //codelist: useRef<HTMLButtonElement>(null), // Odstraň referenci pro záložku 'codelist' (řádek 139):
    differences: useRef<HTMLButtonElement>(null),
    examples: useRef<HTMLButtonElement>(null),
    faq: useRef<HTMLButtonElement>(null),
    converter: useRef<HTMLButtonElement>(null),
  };

   // Filtrované endpointy pro zobrazení
   const filteredEndpoints = apiData.endpointMappings.filter(
    (ep: Endpoint) => !searchTerm || 
    ep.soapOperation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ep.restEndpoint.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Číselníkové endpointy
//  const codelistEndpoints = apiData.endpointMappings.filter(
//   (ep: Endpoint) => ep.category === 'codelist' && 
//   (!searchTerm || 
//    ep.soapOperation.toLowerCase().includes(searchTerm.toLowerCase()) ||
//    ep.restEndpoint.toLowerCase().includes(searchTerm.toLowerCase()))
// );

// UseEffect pro nastavení faviconu a indikátoru záložek
useEffect(() => {
  const existingFavicon = document.querySelector("link[rel='icon']");
  const faviconElement = (existingFavicon || document.createElement('link')) as HTMLLinkElement;
  faviconElement.type = 'image/svg+xml';
  faviconElement.rel = 'icon';
  faviconElement.href = FaviconPPL;
  if (!existingFavicon) document.head.appendChild(faviconElement);

  return () => {
    if (!existingFavicon && faviconElement.parentNode) {
      document.head.removeChild(faviconElement);
    }
  };
}, []);

useEffect(() => {
  const activeTabRef = tabRefs[activeTab];
  if (activeTabRef?.current) {
    const tabElement = activeTabRef.current;
    setIndicatorStyle({
      left: `${tabElement.offsetLeft}px`,
      width: `${tabElement.offsetWidth}px`,
    });
  }
}, [activeTab]);

// Přepínání rozbalení/sbalení rozdílů
const toggleDifference = (index: number) => {
  setExpandedDifferences(prev => 
    prev.includes(index) 
      ? prev.filter(i => i !== index) 
      : [...prev, index]
  );
};

// Zvýraznění rozdílů v polích
const highlightDifferences = (field: Field) => {
  const hasTypeDiff = field.soapType !== field.restType;
  const hasRequiredDiff = field.soapRequired !== field.restRequired;
  const hasLengthDiff = field.soapLength !== field.restLength;
  const hasAnyDiff = hasTypeDiff || hasRequiredDiff || hasLengthDiff;
  
  return { hasTypeDiff, hasRequiredDiff, hasLengthDiff, hasAnyDiff };
};

// Filtrování polí podle vyhledávání
const getFilteredFields = (mappingId: string | null) => {
  if (!mappingId) return [];
  
  const mapping = apiData.fieldMappings[mappingId as keyof typeof apiData.fieldMappings];
  if (!mapping || !mapping.fields) return [];
  
  return mapping.fields.filter((field: Field) => 
    !searchTerm || 
    field.soapField.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.restField.toLowerCase().includes(searchTerm.toLowerCase())
  );
};

// Kopírování do schránky (přidána implementace chybějící funkce)
const copyToClipboard = (text: string, buttonId: string): void => {
  navigator.clipboard.writeText(text).then(
    () => {
      setCopiedButtonId(buttonId);
      setTimeout(() => setCopiedButtonId(null), 2000); // Reset po 2 sekundách
    },
    (err) => {
      console.error('Nepodařilo se zkopírovat text: ', err);
    }
  );
};

// Pomocné funkce pro extrakci hodnot z XML - AKTUALIZOVANÉ FUNKCE
// Extrakce hodnoty z XML tagu
const extractValue = (xml: string, path: string): string | null => {
  const tagName = path.split('.').pop();
  if (!tagName) return null;
  const pattern = new RegExp(`<(?:\\w+:)?${tagName}[^>]*>([^<]*)</(?:\\w+:)?${tagName}>`, 'i');
  const match = xml.match(pattern);
  return match ? match[1].replace('<![CDATA[', '').replace(']]>', '').trim() : null;
};

// Extrakce vnořené hodnoty
const extractNestedValue = (xml: string, parentPath: string, childPath: string): string | null => {
  const parentTag = parentPath.split('.').pop();
  const childTag = childPath.split('.').pop();
  if (!parentTag || !childTag) return null;

  const parentPattern = new RegExp(`<(?:\\w+:)?${parentTag}[^>]*>(.*?)</(?:\\w+:)?${parentTag}>`, 'is');
  const parentMatch = xml.match(parentPattern);

  if (parentMatch?.[1]) {
    const parentContent = parentMatch[1];
    const childPattern = new RegExp(`<(?:\\w+:)?${childTag}[^>]*>([^<]*)</(?:\\w+:)?${childTag}>`, 'i');
    const childMatch = parentContent.match(childPattern);
    return childMatch ? childMatch[1].replace('<![CDATA[', '').replace(']]>', '').trim() : null;
  }
  return null;
};

// NOVÁ FUNKCE: Extrakce pole hodnot (např. pro PackNumbers[])
const extractArrayValues = (xml: string, path: string): string[] => {
  const parts = path.split('.');
  if (parts.length < 2) return [];
  
  const parentTag = parts[0];
  const childTag = parts[1];
  
  // Najdeme obsah rodičovského tagu
  const parentPattern = new RegExp(`<(?:\\w+:)?${parentTag}[^>]*>(.*?)</(?:\\w+:)?${parentTag}>`, 'is');
  const parentMatch = xml.match(parentPattern);
  
  if (!parentMatch?.[1]) return [];
  
  const parentContent = parentMatch[1];
  
  // Najdeme všechny výskyty child tagu a extrahujeme hodnoty
  const childRegex = new RegExp(`<(?:\\w+:)?${childTag}[^>]*>([^<]*)</(?:\\w+:)?${childTag}>`, 'ig');
  const values: string[] = [];
  let match;
  
  while ((match = childRegex.exec(parentContent)) !== null) {
    values.push(match[1].replace('<![CDATA[', '').replace(']]>', '').trim());
  }
  
  return values;
};

// NOVÁ FUNKCE: Vytvoření query stringu z parametrů
const constructQueryString = (params: Record<string, string | string[] | undefined>): string => {
  if (!params || Object.keys(params).length === 0) return '';
  
  const queryParts: string[] = [];
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    
    if (Array.isArray(value)) {
      // Pro pole hodnot přidáme každou hodnotu zvlášť s opakovaným klíčem
      value.forEach(item => {
        if (item) queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
      });
    } else {
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  });
  
  return queryParts.length ? '?' + queryParts.join('&') : '';
};

// NOVÁ FUNKCE: Formátování data do YYYY-MM-DD
const formatDateToYYYYMMDD = (dateStr: string): string => {
  try {
    // Pokud už má správný formát, vrátíme jej
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
    
    // Zkusíme převést na datum
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      console.warn("Neplatné datum:", dateStr);
      return new Date().toISOString().split('T')[0]; // Dnešní datum jako záloha
    }
    
       // Formátování na YYYY-MM-DD
       const year = date.getFullYear();
       const month = String(date.getMonth() + 1).padStart(2, '0');
       const day = String(date.getDate()).padStart(2, '0');
       
       return `${year}-${month}-${day}`;
     } catch (error) {
       console.error("Chyba při formátování data:", error);
       return new Date().toISOString().split('T')[0]; // Dnešní datum jako záloha
     }
   };
   
// Zpracování CreatePackages - OPRAVENÁ VERZE
const handleCreatePackages = (xml: string) => {
  // --- Extrakce pro top-level pole (pokud existuje) ---
  const integratorId = extractValue(xml, 'IntegrId') ?? undefined;

  // --- Extrakce pro Shipment objekt ---
  const shipment: Shipment = {
    productType: extractValue(xml, 'PackProductType') || 'BUSS',
    referenceId: extractValue(xml, 'PackRef') ?? undefined,
    note: extractValue(xml, 'Note') ?? undefined,
    depot: extractValue(xml, 'DepoCode') ?? undefined,
    sender: {
      name: extractNestedValue(xml, 'Sender', 'Name') || 'chybějící - jméno',
      street: extractNestedValue(xml, 'Sender', 'Street') || 'chybějící - ulice',
      city: extractNestedValue(xml, 'Sender', 'City') || 'chybějící - město',
      zipCode: extractNestedValue(xml, 'Sender', 'ZipCode') || 'chybějící - PSČ',
      country: extractNestedValue(xml, 'Sender', 'Country') || 'CZ',
      name2: extractNestedValue(xml, 'Sender', 'Name2') ?? undefined,
      contact: extractNestedValue(xml, 'Sender', 'Contact') ?? undefined,
      phone: extractNestedValue(xml, 'Sender', 'Phone') ?? undefined,
      email: extractNestedValue(xml, 'Sender', 'Email') ?? undefined,
    },
    recipient: {
      name: extractNestedValue(xml, 'Recipient', 'Name') || 'chybějící - jméno',
      street: extractNestedValue(xml, 'Recipient', 'Street') || 'chybějící - ulice',
      city: extractNestedValue(xml, 'Recipient', 'City') || 'chybějící - město',
      zipCode: extractNestedValue(xml, 'Recipient', 'ZipCode') || 'chybějící - PSČ',
      country: extractNestedValue(xml, 'Recipient', 'Country') || 'CZ',
      phone: extractNestedValue(xml, 'Recipient', 'Phone') || 'chybějící - telefon',
      email: extractNestedValue(xml, 'Recipient', 'Email') || 'chybějící - email',
      name2: extractNestedValue(xml, 'Recipient', 'Name2') ?? undefined,
      contact: extractNestedValue(xml, 'Recipient', 'Contact') ?? undefined,
    }
  };

  // Přidáme shipmentSet, pokud se nalezne v XML
  const packagesInSet = extractNestedValue(xml, 'PackageSet', 'PackagesInSet');
  if (packagesInSet) {
    shipment.shipmentSet = {
      numberOfShipments: parseInt(packagesInSet, 10) || 1
    };
  }

  // --- AKTUALIZACE: Validace povinných polí pro REST ---
  // Ověříme, že telefon a email příjemce jsou vyplněny (v REST API jsou povinné)
  if (!shipment.recipient.phone || shipment.recipient.phone === 'chybějící - telefon') {
    console.warn("Chybí povinné pole recipient.phone, bude nutné doplnit");
    // Můžeme nastavit defaultní hodnotu nebo nechat uživatele vědět
    shipment.recipient.phone = "VYŽADOVÁNO V REST API";
  }
  
  if (!shipment.recipient.email || shipment.recipient.email === 'chybějící - email') {
    console.warn("Chybí povinné pole recipient.email, bude nutné doplnit");
    shipment.recipient.email = "VYŽADOVÁNO V REST API";
  }

  // --- Volitelná pole přidáváme pouze pokud existují v SOAP ---
  const weightStr = extractValue(xml, 'Weight');
  if (weightStr) {
    // AKTUALIZACE: Převod na číslo pro REST API
    const weightNum = parseFloat(weightStr);
    shipment.weight = !isNaN(weightNum) ? weightNum : weightStr;
  }

  const parcelShopCode = extractNestedValue(xml, 'SpecDelivery', 'ParcelShopCode');
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
       const priceNum = parseFloat(codPriceStr);
       if(!isNaN(priceNum)) {
          shipment.cashOnDelivery.codPrice = priceNum; // Převod na číslo
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

  // --- Sestavení finálního výstupního objektu ---
  const restBody: any = {
      returnChannel: { type: "None" },
      labelSettings: { format: "Pdf", dpi: 300 },
      shipments: [shipment]
  };

  if (integratorId) {
      restBody.integratorId = integratorId;
  }

  setRestOutput({
    success: true,
    operation: 'CreatePackages',
    method: 'POST',
    path: '/shipment/batch',
    body: restBody
  });
};

// Zpracování CreateOrders - POUZE pro doručovací objednávky
const handleCreateOrders = (xml: string) => {
  try {
      console.log("Zpracovávám CreateOrders - doručovací objednávku");
      
      // Zjistíme kódy zemí odesílatele a příjemce
      const senderCountry = extractNestedValue(xml, 'Sender', 'Country') || 'CZ';
      const recipientCountry = extractNestedValue(xml, 'Recipient', 'Country') || 'CZ';

      // Určení správného productType podle pravidel
      let defaultProductType = 'BUSS'; // výchozí hodnota

      // z CZ do CZ = BUSS
      if (senderCountry === 'CZ' && recipientCountry === 'CZ') {
          defaultProductType = 'BUSS';
      }
      // z CZ do SK = CONN
      else if (senderCountry === 'CZ' && recipientCountry === 'SK') {
          defaultProductType = 'CONN';
      }
      // z SK do CZ = IMPO
      else if (senderCountry === 'SK' && recipientCountry === 'CZ') {
          defaultProductType = 'IMPO';
      }

      // Použijeme buď hodnotu z XML nebo vypočtenou výchozí hodnotu
      const productType = extractValue(xml, 'PackProductType') || defaultProductType;
      
      // Vytvoření objektu order s explicitní definicí typu
      const order: {
          referenceId: string;
          productType: string;
          orderType: string;
          packageCount: number;
          date: string;
          note?: string;
          email?: string;
          customerReference?: string;
          sender: {
              name: string;
              street: string;
              city: string;
              zipCode: string;
              country: string;
              phone: string;
              email: string;
              name2?: string;
              contact?: string;
          };
          recipient: {
              name: string;
              street: string;
              city: string;
              zipCode: string;
              country: string;
              phone: string;
              email: string;
              name2?: string;
              contact?: string;
          };
      } = {
          referenceId: extractValue(xml, 'OrdRefId') || `chybějící-${Date.now()}`,
          productType: productType,
          orderType: 'transportOrder', // Pevně dáno - objednávka doručení
          packageCount: 1, // Výchozí hodnota
          date: new Date().toISOString().split('T')[0], // Výchozí datum
          sender: {
              name: extractNestedValue(xml, 'Sender', 'Name') || 'chybějící - jméno',
              street: extractNestedValue(xml, 'Sender', 'Street') || 'chybějící - ulice',
              city: extractNestedValue(xml, 'Sender', 'City') || 'chybějící - město',
              zipCode: extractNestedValue(xml, 'Sender', 'ZipCode') || 'chybějící - PSČ',
              country: extractNestedValue(xml, 'Sender', 'Country') || 'CZ',
              phone: extractNestedValue(xml, 'Sender', 'Phone') || 'chybějící - telefon',
              email: extractNestedValue(xml, 'Sender', 'Email') || 'chybějící - email',
          },
          recipient: {
              name: extractNestedValue(xml, 'Recipient', 'Name') || 'chybějící - jméno',
              street: extractNestedValue(xml, 'Recipient', 'Street') || 'chybějící - ulice',
              city: extractNestedValue(xml, 'Recipient', 'City') || 'chybějící - město',
              zipCode: extractNestedValue(xml, 'Recipient', 'ZipCode') || 'chybějící - PSČ',
              country: extractNestedValue(xml, 'Recipient', 'Country') || 'CZ',
              phone: extractNestedValue(xml, 'Recipient', 'Phone') || 'chybějící - telefon',
              email: extractNestedValue(xml, 'Recipient', 'Email') || 'chybějící - email',
          }
      };

      // AKTUALIZACE: Lepší zpracování countPack - zajištění, že je to vždy číslo
      const countPackStr = extractValue(xml, 'CountPack');
      if (countPackStr) {
          const packCount = parseInt(countPackStr, 10);
          if (!isNaN(packCount)) {
              order.packageCount = packCount;
          }
      }

      // Volitelná pole
      const note = extractValue(xml, 'Note');
      if (note) {
          order.note = note;
      }

      const email = extractValue(xml, 'Email');
      if (email) {
          order.email = email;
      }

      // Doplňující pole odesílatele
      const senderName2 = extractNestedValue(xml, 'Sender', 'Name2');
      if (senderName2) {
          order.sender.name2 = senderName2;
      }

      const senderContact = extractNestedValue(xml, 'Sender', 'Contact');
      if (senderContact) {
          order.sender.contact = senderContact;
      }

      // Doplňující pole příjemce
      const recipientName2 = extractNestedValue(xml, 'Recipient', 'Name2');
      if (recipientName2) {
          order.recipient.name2 = recipientName2;
      }
  
      const recipientContact = extractNestedValue(xml, 'Recipient', 'Contact');
      if (recipientContact) {
          order.recipient.contact = recipientContact;
      }

      // AKTUALIZACE: Správné formátování data pro REST API (YYYY-MM-DD)
      const sendDateRaw = extractValue(xml, 'SendDate');
      if (sendDateRaw) {
          order.date = formatDateToYYYYMMDD(sendDateRaw);
      }

      // AKTUALIZACE: Validace povinných polí pro odesílatele
      if (!order.sender.phone || order.sender.phone === 'chybějící - telefon') {
          console.warn("Chybí povinné pole sender.phone pro objednávku");
          order.sender.phone = "VYŽADOVÁNO V REST API";
      }
      
      if (!order.sender.email || order.sender.email === 'chybějící - email') {
          console.warn("Chybí povinné pole sender.email pro objednávku");
          order.sender.email = "VYŽADOVÁNO V REST API";
      }

      // AKTUALIZACE: Validace povinných polí pro příjemce
      if (!order.recipient.phone || order.recipient.phone === 'chybějící - telefon') {
          console.warn("Chybí povinné pole recipient.phone pro objednávku");
          order.recipient.phone = "VYŽADOVÁNO V REST API";
      }
          
      if (!order.recipient.email || order.recipient.email === 'chybějící - email') {
          console.warn("Chybí povinné pole recipient.email pro objednávku");
          order.recipient.email = "VYŽADOVÁNO V REST API";
      }

      const custRefValue = extractValue(xml, 'CustRef');
      if (custRefValue) {
          order.customerReference = custRefValue;
      }

      // Přidání výpisu finálního objektu pro kontrolu
      console.log("Finální objekt order:", JSON.stringify(order, null, 2));

      setRestOutput({
        success: true,
        operation: 'CreateOrders',
        method: 'POST',
        path: '/order/batch',
        body: { orders: [order] }
      });
  } catch (error: any) {
       console.error("Chyba uvnitř handleCreateOrders:", error);
       setRestOutput({
         success: false,
         error: `Chyba při zpracování CreateOrders: ${error.message}`
       });
  }
};

// Zpracování CreatePickupOrders - POUZE pro svozové objednávky
const handleCreatePickupOrders = (xml: string) => {
  try {
      console.log("Zpracovávám CreatePickupOrders - svozovou objednávku");
      
      // Vytvoření objektu order s explicitní definicí typu
      const order: {
          referenceId: string;
          productType: string;
          orderType: string;
          packageCount: number;
          date: string;
          note?: string;
          email?: string;
          customerReference?: string;
          sender: {
              name: string;
              street: string;
              city: string;
              zipCode: string;
              country: string;
              phone: string;
              email: string;
              name2?: string;
              contact?: string;
          };
      } = {
          referenceId: extractValue(xml, 'OrdRefId') || `chybějící-${Date.now()}`,
          productType: extractValue(xml, 'PackProductType') || 'BUSS',
          orderType: 'collectionOrder', // Pevně dáno - objednávka svozu
          packageCount: 1, // Výchozí hodnota
          date: new Date().toISOString().split('T')[0], // Výchozí datum
          sender: {
              name: extractNestedValue(xml, 'Sender', 'Name') || 'chybějící - jméno',
              street: extractNestedValue(xml, 'Sender', 'Street') || 'chybějící - ulice',
              city: extractNestedValue(xml, 'Sender', 'City') || 'chybějící - město',
              zipCode: extractNestedValue(xml, 'Sender', 'ZipCode') || 'chybějící - PSČ',
              country: extractNestedValue(xml, 'Sender', 'Country') || 'CZ',
              phone: extractNestedValue(xml, 'Sender', 'Phone') || 'chybějící - telefon',
              email: extractNestedValue(xml, 'Sender', 'Email') || 'chybějící - email',
          }
      };

      // AKTUALIZACE: Lepší zpracování countPack - zajištění, že je to vždy číslo
      const countPackStr = extractValue(xml, 'CountPack');
      if (countPackStr) {
          const packCount = parseInt(countPackStr, 10);
          if (!isNaN(packCount)) {
              order.packageCount = packCount;
          }
      }

      // Volitelná pole
      const note = extractValue(xml, 'Note');
      if (note) {
          order.note = note;
      }

      const email = extractValue(xml, 'Email');
      if (email) {
          order.email = email;
      }

      // Doplňující pole odesílatele
      const senderName2 = extractNestedValue(xml, 'Sender', 'Name2');
      if (senderName2) {
          order.sender.name2 = senderName2;
      }

      const senderContact = extractNestedValue(xml, 'Sender', 'Contact');
      if (senderContact) {
          order.sender.contact = senderContact;
      }

      // AKTUALIZACE: Správné formátování data pro REST API (YYYY-MM-DD)
      const sendDateRaw = extractValue(xml, 'SendDate');
      if (sendDateRaw) {
          order.date = formatDateToYYYYMMDD(sendDateRaw);
      }

      // AKTUALIZACE: Validace povinných polí pro odesílatele
      if (!order.sender.phone || order.sender.phone === 'chybějící - telefon') {
          console.warn("Chybí povinné pole sender.phone pro objednávku");
          order.sender.phone = "VYŽADOVÁNO V REST API";
      }
      
      if (!order.sender.email || order.sender.email === 'chybějící - email') {
          console.warn("Chybí povinné pole sender.email pro objednávku");
          order.sender.email = "VYŽADOVÁNO V REST API";
      }

      const custRefValue = extractValue(xml, 'CustRef');
      if (custRefValue) {
          order.customerReference = custRefValue;
      }

      // Přidání výpisu finálního objektu pro kontrolu
      console.log("Finální objekt pickup order:", JSON.stringify(order, null, 2));

      setRestOutput({
        success: true,
        operation: 'CreatePickupOrders',
        method: 'POST',
        path: '/order/batch',
        body: { orders: [order] }
      });
  } catch (error: any) {
       console.error("Chyba uvnitř handleCreatePickupOrders:", error);
       setRestOutput({
         success: false,
         error: `Chyba při zpracování CreatePickupOrders: ${error.message}`
       });
  }
};

// NOVÁ METODA: Zpracování GetPackages (sledování zásilek)
const handleGetPackages = (xml: string) => {
  try {
    // Extrahujeme filter sekci
    const filter: PackageFilter = {};
    
    // Zpracování pole PackNumbers[] - čísla zásilek
    const packNumbers = extractArrayValues(xml, 'Filter.PackNumbers');
    if (packNumbers.length > 0) {
      filter.packNumbers = packNumbers;
    }
    
    // Zpracování pole CustRefs[] - zákaznické reference
    const custRefs = extractArrayValues(xml, 'Filter.CustRefs');
    if (custRefs.length > 0) {
      filter.custRefs = custRefs;
    }
    
    // Extrakce datumů
    const dateFrom = extractValue(xml, 'Filter.DateFrom');
    if (dateFrom) {
      filter.dateFrom = formatDateToYYYYMMDD(dateFrom);
    }
    
    const dateTo = extractValue(xml, 'Filter.DateTo');
    if (dateTo) {
      filter.dateTo = formatDateToYYYYMMDD(dateTo);
    }
    
    // Extrakce stavů zásilek
    const packageStates = extractArrayValues(xml, 'Filter.PackageStates');
    if (packageStates.length > 0) {
      filter.packageStates = packageStates;
    }
    
    // Sestavení REST query parametrů
    const queryParams: Record<string, string | string[]> = {};
    
    if (filter.packNumbers && filter.packNumbers.length > 0) {
      queryParams.ShipmentNumbers = filter.packNumbers;
    }
    
    if (filter.custRefs && filter.custRefs.length > 0) {
      queryParams.CustomerReferences = filter.custRefs;
    }
    
    if (filter.dateFrom) {
      queryParams.DateFrom = filter.dateFrom;
    }
    
    if (filter.dateTo) {
      queryParams.DateTo = filter.dateTo;
    }
    
    if (filter.packageStates && filter.packageStates.length > 0) {
      queryParams.ShipmentStates = filter.packageStates;
    }
    
    setRestOutput({
      success: true,
      operation: 'GetPackages',
      method: 'GET',
      path: '/shipment',
      queryParams: queryParams,
      body: null // GET nemá body
    });
  } catch (error: any) {
    console.error("Chyba zpracování GetPackages:", error);
    setRestOutput({
      success: false,
      error: `Chyba při zpracování GetPackages: ${error.message}`
    });
  }
};

// NOVÁ METODA: Zpracování CancelPackage (storno zásilky)
const handleCancelPackage = (xml: string) => {
  try {
    // Extrakce čísla zásilky - povinné
    const packNumber = extractValue(xml, 'PackNumber');
    if (!packNumber) {
      setRestOutput({ 
        success: false, 
        error: "Chybí povinné číslo zásilky (PackNumber)" 
      });
      return;
    }
    
    // Extrakce poznámky - volitelné
    const note = extractValue(xml, 'Note');
    
    // V REST API je číslo zásilky součástí URL, poznámka je v těle
    const body = note ? { note } : {};
    
    setRestOutput({
      success: true,
      operation: 'CancelPackage',
      method: 'POST',
      path: `/shipment/${packNumber}/cancel`,
      body: body
    });
  } catch (error: any) {
    console.error("Chyba zpracování CancelPackage:", error);
    setRestOutput({
      success: false,
      error: `Chyba při zpracování CancelPackage: ${error.message}`
    });
  }
};

// NOVÁ METODA: Zpracování UpdatePackage (aktualizace kontaktů zásilky)
const handleUpdatePackage = (xml: string) => {
  try {
    // Extrakce čísla zásilky - povinné
    const packNumber = extractValue(xml, 'PackNumber');
    if (!packNumber) {
      setRestOutput({ 
        success: false, 
        error: "Chybí povinné číslo zásilky (PackNumber)" 
      });
      return;
    }
    
    // Extrakce nových kontaktních údajů
    // V SOAP může být více polí, v REST API jsou jen telefon, email a poznámka
    const body: { recipientContact: { phone?: string; email?: string; }; note?: string } = {
      recipientContact: {}
    };
    
    // Telefon příjemce
    const recipientPhone = extractNestedValue(xml, 'Recipient', 'Phone');
    if (recipientPhone) {
      body.recipientContact.phone = recipientPhone;
    }
    
    // Email příjemce
    const recipientEmail = extractNestedValue(xml, 'Recipient', 'Email');
    if (recipientEmail) {
      body.recipientContact.email = recipientEmail;
    }
    
    // Poznámka k aktualizaci
    const note = extractValue(xml, 'Note');
    if (note) {
      body.note = note;
    }
    
    // Kontrola, zda máme alespoň jeden kontaktní údaj
    if (Object.keys(body.recipientContact).length === 0) {
      setRestOutput({ 
        success: false, 
        error: "Chybí kontaktní údaje pro aktualizaci (telefon nebo email)" 
      });
      return;
    }
    
    setRestOutput({
      success: true,
      operation: 'UpdatePackage',
      method: 'POST',
      path: `/shipment/${packNumber}/redirect`,
      body: body
    });
  } catch (error: any) {
    console.error("Chyba zpracování UpdatePackage:", error);
    setRestOutput({
      success: false,
      error: `Chyba při zpracování UpdatePackage: ${error.message}`
    });
  }
};

// NOVÁ METODA: Zpracování GetOrders (sledování objednávek)
const handleGetOrders = (xml: string) => {
  try {
    // Extrahujeme filter sekci
    const filter: OrderFilter = {};
    
    // Zpracování pole OrderNumbers[] - čísla objednávek
    const orderNumbers = extractArrayValues(xml, 'Filter.OrderNumbers');
    if (orderNumbers.length > 0) {
      filter.orderNumbers = orderNumbers;
    }
    
    // Zpracování pole CustRefs[] - zákaznické reference
    const custRefs = extractArrayValues(xml, 'Filter.CustRefs');
    if (custRefs.length > 0) {
      filter.custRefs = custRefs;
    }
    
    // Extrakce datumů
    const dateFrom = extractValue(xml, 'Filter.DateFrom');
    if (dateFrom) {
      filter.dateFrom = formatDateToYYYYMMDD(dateFrom);
    }
    
    const dateTo = extractValue(xml, 'Filter.DateTo');
    if (dateTo) {
      filter.dateTo = formatDateToYYYYMMDD(dateTo);
    }
    
    // Extrakce stavů objednávek
    const orderStates = extractArrayValues(xml, 'Filter.OrderStates');
    if (orderStates.length > 0) {
      filter.orderStates = orderStates;
    }
    
    // Sestavení REST query parametrů
    const queryParams: Record<string, string | string[]> = {};
    
    if (filter.orderNumbers && filter.orderNumbers.length > 0) {
      queryParams.OrderNumbers = filter.orderNumbers;
    }
    
    if (filter.custRefs && filter.custRefs.length > 0) {
      queryParams.CustomerReferences = filter.custRefs;
    }
    
    if (filter.dateFrom) {
      queryParams.DateFrom = filter.dateFrom;
    }
    
    if (filter.dateTo) {
      queryParams.DateTo = filter.dateTo;
    }
    
    if (filter.orderStates && filter.orderStates.length > 0) {
      queryParams.OrderStates = filter.orderStates;
    }
    
    setRestOutput({
      success: true,
      operation: 'GetOrders',
      method: 'GET',
      path: '/order',
      queryParams: queryParams,
      body: null // GET nemá body
    });
  } catch (error: any) {
    console.error("Chyba zpracování GetOrders:", error);
    setRestOutput({
      success: false,
      error: `Chyba při zpracování GetOrders: ${error.message}`
    });
  }
};

// NOVÁ METODA: Zpracování CancelOrder (storno objednávky)
const handleCancelOrder = (xml: string) => {
  try {
    // Extrakce čísla objednávky nebo zákaznické reference
    const orderNumber = extractValue(xml, 'OrderNumber');
    const custRef = extractValue(xml, 'CustRef');
    
    if (!orderNumber && !custRef) {
      setRestOutput({ 
        success: false, 
        error: "Chybí identifikace objednávky (OrderNumber nebo CustRef)" 
      });
      return;
    }
    
    // Extrakce poznámky - volitelné
    const note = extractValue(xml, 'Note');
    
    // V REST API je vše jako query parametry
    const queryParams: Record<string, string> = {};
    
    if (orderNumber) {
      queryParams.orderNumber = orderNumber;
    }
    
    if (custRef) {
      queryParams.customerReference = custRef;
    }
    
    if (note) {
      queryParams.note = note;
    }
    
    setRestOutput({
      success: true,
      operation: 'CancelOrder',
      method: 'POST',
      path: '/order/cancel',
      queryParams: queryParams,
      body: {} // POST, ale prázdné tělo
    });
  } catch (error: any) {
    console.error("Chyba zpracování CancelOrder:", error);
    setRestOutput({
      success: false,
      error: `Chyba při zpracování CancelOrder: ${error.message}`
    });
  }
};

// NOVÁ METODA: Zpracování GetParcelShops (výdejní místa)
const handleGetParcelShops = (xml: string) => {
  try {
    // Extrahujeme filter sekci
    const filter: ParcelShopFilter = {};
    
    // Extrakce polí filtru
    const code = extractValue(xml, 'Filter.Code');
    if (code) {
      filter.code = code;
    }
    
    const countryCode = extractValue(xml, 'Filter.CountryCode');
    if (countryCode) {
      filter.countryCode = countryCode;
    }
    
    const zipCode = extractValue(xml, 'Filter.ZipCode');
    if (zipCode) {
      filter.zipCode = zipCode;
    }
    
    const city = extractValue(xml, 'Filter.City');
    if (city) {
      filter.city = city;
    }
    
    const street = extractValue(xml, 'Filter.Street');
    if (street) {
      filter.street = street;
    }
    
    // Sestavení REST query parametrů
    const queryParams: Record<string, string> = {};
    
    if (filter.code) {
      queryParams.AccessPointCode = filter.code;
    }
    
    if (filter.countryCode) {
      queryParams.CountryCode = filter.countryCode;
    }
    
    if (filter.zipCode) {
      queryParams.ZipCode = filter.zipCode;
    }
    
    if (filter.city) {
      queryParams.City = filter.city;
    }
    
    if (filter.street) {
      queryParams.Street = filter.street;
    }
    
    setRestOutput({
      success: true,
      operation: 'GetParcelShops',
      method: 'GET',
      path: '/accessPoint',
      queryParams: queryParams,
      body: null // GET nemá body
    });
  } catch (error: any) {
    console.error("Chyba zpracování GetParcelShops:", error);
    setRestOutput({
      success: false,
      error: `Chyba při zpracování GetParcelShops: ${error.message}`
    });
  }
};

// Handler pro transformaci - AKTUALIZOVANÁ VERZE
const handleTransform = () => {
  if (!soapInput.trim()) {
    setRestOutput({ success: false, error: "Prosím, zadejte SOAP XML požadavek." });
    return;
  }
  try {
    console.log("--- Debug handleTransform ---");
    console.log("Testovaný SOAP Input:", JSON.stringify(soapInput));

    let operation: string | null = null;
    
    // Detekce SOAP operace - rozšířeno o nové operace
    const isCreatePackages = /<\s*(\w+:)?CreatePackages[^>]*>/i.test(soapInput);
    const isCreateOrders = /<\s*(\w+:)?CreateOrders[^>]*>/i.test(soapInput);
    const isCreatePickupOrders = /<\s*(\w+:)?CreatePickupOrders[^>]*>/i.test(soapInput);
    const isGetPackages = /<\s*(\w+:)?GetPackages[^>]*>/i.test(soapInput);
    const isCancelPackage = /<\s*(\w+:)?CancelPackage[^>]*>/i.test(soapInput);
    const isUpdatePackage = /<\s*(\w+:)?UpdatePackage[^>]*>/i.test(soapInput);
    const isGetOrders = /<\s*(\w+:)?GetOrders[^>]*>/i.test(soapInput);
    const isCancelOrder = /<\s*(\w+:)?CancelOrder[^>]*>/i.test(soapInput);
    const isGetParcelShops = /<\s*(\w+:)?GetParcelShops[^>]*>/i.test(soapInput);

    console.log("Test <CreatePackages> výsledek:", isCreatePackages);
    console.log("Test <CreateOrders> výsledek:", isCreateOrders);
    console.log("Test <GetPackages> výsledek:", isGetPackages);
    console.log("Test <CancelPackage> výsledek:", isCancelPackage);
    console.log("Test <UpdatePackage> výsledek:", isUpdatePackage);
    console.log("Test <GetOrders> výsledek:", isGetOrders);
    console.log("Test <CancelOrder> výsledek:", isCancelOrder);
    console.log("Test <GetParcelShops> výsledek:", isGetParcelShops);

      // Určení operace
    if (isCreatePackages) {
      operation = 'CreatePackages';
    } else if (isCreateOrders) {
      operation = 'CreateOrders';
    } else if (isCreatePickupOrders) {
      operation = 'CreatePickupOrders';
    } else if (isGetPackages) {
      operation = 'GetPackages';
    } else if (isCancelPackage) {
      operation = 'CancelPackage';
    } else if (isUpdatePackage) {
      operation = 'UpdatePackage';
    } else if (isGetOrders) {
      operation = 'GetOrders';
    } else if (isCancelOrder) {
      operation = 'CancelOrder';
    } else if (isGetParcelShops) {
      operation = 'GetParcelShops';
    }

    console.log("Detekovaná operace:", operation);

    if (!operation) {
      setRestOutput({ 
        success: false, 
        error: "Nepodporovaná nebo nerozpoznaná operace (podporované operace: CreatePackages, CreateOrders, GetPackages, CancelPackage, UpdatePackage, GetOrders, CancelOrder, GetParcelShops)." 
      });
      console.log("Operace nerozpoznána, nastavuji chybu.");
      return;
    }

    // Volání příslušné metody podle detekované operace
switch(operation) {
  case 'CreatePackages':
    console.log("Volám handleCreatePackages...");
    handleCreatePackages(soapInput);
    break;
  case 'CreateOrders':
    console.log("Volám handleCreateOrders...");
    handleCreateOrders(soapInput);
    break;
  case 'CreatePickupOrders':
    console.log("Volám handleCreatePickupOrders...");
    handleCreatePickupOrders(soapInput);
    break;
  case 'GetPackages':
    console.log("Volám handleGetPackages...");
    handleGetPackages(soapInput);
    break;
  case 'CancelPackage':
    console.log("Volám handleCancelPackage...");
    handleCancelPackage(soapInput);
    break;
  case 'UpdatePackage':
    console.log("Volám handleUpdatePackage...");
    handleUpdatePackage(soapInput);
    break;
  case 'GetOrders':
    console.log("Volám handleGetOrders...");
    handleGetOrders(soapInput);
    break;
  case 'CancelOrder':
    console.log("Volám handleCancelOrder...");
    handleCancelOrder(soapInput);
    break;
  case 'GetParcelShops':
    console.log("Volám handleGetParcelShops...");
    handleGetParcelShops(soapInput);
    break;
  default:
    // Nemělo by nastat díky předchozí kontrole
    setRestOutput({ success: false, error: "Neimplementovaná operace" });
}
  } catch (error: any) {
    setRestOutput({ success: false, error: `Chyba při transformaci: ${error.message}` });
    console.error("Chyba transformace:", error);
  }
};

// Reset formuláře převodníku
const resetConverterForm = () => {
  setSoapInput('');
  setRestOutput(null);
};

// Renderování výstupu pro REST
const renderRestOutput = () => {
  if (restOutput === null) {
    return (
      <div className="output-placeholder flex-grow">
        Transformovaný REST JSON výsledek se zobrazí zde.
      </div>
    );
  }
  
  if (!restOutput.success) {
    return (
      <div className="output-error flex-grow">
        <AlertCircle size={18} className="mr-2 flex-shrink-0"/> Chyba: {restOutput.error}
      </div>
    );
  }
  
  // Sestavení URL s query parametry
  let url = `${converterBaseUrl}${restOutput.path}`;
  if (restOutput.queryParams && Object.keys(restOutput.queryParams).length > 0) {
    url += constructQueryString(restOutput.queryParams);
  }
  
  return (
    <div className="output-success flex-grow">
      {/* Endpoint URL */}
      <div className="output-section">
        <div className="flex justify-between items-center mb-1">
          <h4 className="output-title">Endpoint:</h4>
          <button 
            className="btn-copy" 
            onClick={() => copyToClipboard(`${restOutput.method} ${url}`, 'rest-url')}
          >
            {copiedButtonId === 'rest-url' ? <Check size={14}/> : <Copy size={14}/>}
            <span className="ml-1">Kopírovat URL</span>
          </button>
        </div>
        <div className="output-code-block flex items-center text-xs break-all">
          <span className={`font-semibold mr-2 ${restOutput.method === 'POST' ? 'text-green-600' : 'text-blue-600'}`}>
            {restOutput.method}
          </span>
          <span className="text-gray-700">{url}</span>
        </div>
      </div>
      
      {/* Body JSON - zobrazení pouze pokud existuje body */}
      {restOutput.body && (
        <div className="output-section flex-1 flex flex-col min-h-0">
          <div className="flex justify-between items-center mb-1 flex-shrink-0">
            <h4 className="output-title">Body (JSON):</h4>
            <button 
              className="btn-copy" 
              onClick={() => copyToClipboard(JSON.stringify(restOutput.body, null, 2), 'rest-body')}
            >
              {copiedButtonId === 'rest-body' ? <Check size={14}/> : <Copy size={14}/>}
              <span className="ml-1">Kopírovat JSON</span>
            </button>
          </div>
          <div className="flex-1 overflow-auto border border-gray-200 rounded bg-gray-50">
            <pre className="output-code-block text-[11px] bg-transparent border-none">
              {JSON.stringify(restOutput.body, null, 2)}
            </pre>
          </div>
        </div>
      )}
      
      {/* Info o transformaci */}
      <div className="output-info mt-2 flex-shrink-0">
        <Check size={16} className="mr-1 text-green-600 flex-shrink-0"/>
        SOAP operace <code className="code">{restOutput.operation}</code> byla úspěšně transformována.
      </div>
    </div>
  );
};

// Zde by byl vrácen JSX komponenty

return (
  // Použití Tailwind tříd pro hlavní kontejner
  <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-lg my-8 font-sans">
    {/* Hlavička (kombinace z obou souborů) */}
    <div className="flex flex-col sm:flex-row items-center justify-between mb-8 pb-4 border-b border-gray-200">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 sm:mb-0 text-center sm:text-left">
         Porovnání myAPI (SOAP) vs CPL API (REST) & Převodník
      </h1>
      {/* Logo z file 2 [cite: 318] */}
      <div className="flex items-center justify-center sm:justify-end gap-4">
           <img src={LogoPPL} alt="PPL Logo" className="h-10 md:h-12" />
           {/* <span className="text-sm text-gray-500 hidden md:inline">PPL API Tools</span> [cite: 130] */}
      </div>
    </div>

    {/* Navigace Záložek (kombinace, přidány 'examples', 'faq', 'converter') */}
    <div className="flex flex-wrap border-b border-gray-200 mb-6 relative">
      {/* Indikátor pod aktivní záložkou */}
      <div
        className="absolute bottom-[-1px] h-0.5 bg-blue-600 transition-all duration-300 ease-in-out"
        style={indicatorStyle} // Styl se nastavuje v useEffect [cite: 52, 301]
      />
      {/* Mapování přes všechny definované záložky */}
      {(Object.keys(tabRefs) as TabName[]).map((tabId) => (
         <button
              key={tabId}
              ref={tabRefs[tabId]} // Připojení ref [cite: 50, 299]
              className={`px-3 py-3 md:px-4 font-medium text-sm md:text-base whitespace-nowrap focus:outline-none ${
                activeTab === tabId
                ? 'text-blue-600' // Aktivní záložka
                : 'text-gray-600 hover:text-blue-600' // Neaktivní záložka
              }`}
              onClick={() => setActiveTab(tabId)} // Nastavení aktivní záložky
          >
              {/* Pěknější názvy záložek */}
              {
                { endpoints: 'Endpointy', fields: 'Pole', differences: 'Rozdíly', examples: 'Příklady', faq: 'FAQ', converter: 'Převodník' }[tabId]
             // { endpoints: 'Endpointy', fields: 'Pole', codelist: 'Číselníky', differences: 'Rozdíly', examples: 'Příklady', faq: 'FAQ', converter: 'Převodník' }[tabId] //číselníky
              }
          </button>
      ))}
    </div>

{/* Vyhledávací panel (zobrazí se jen pro některé záložky) */}
{['endpoints', 'fields', 'differences'].includes(activeTab) && (
// {['endpoints', 'fields', 'codelist', 'differences'].includes(activeTab) && ( // Codelist
      <div className="flex flex-wrap items-center mb-6 gap-4">
        <div className="relative flex-grow max-w-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm" // Přidány focus styly a text-sm
            placeholder={`Vyhledat v záložce "${{ endpoints: 'Endpointy', fields: 'Pole', differences: 'Rozdíly', examples: 'Příklady', faq: 'FAQ', converter: 'Převodník' }[activeTab]}"...`}
            // placeholder={`Vyhledat v záložce "${{ endpoints: 'Endpointy', fields: 'Pole', codelist: 'Číselníky', differences: 'Rozdíly', examples: 'Příklady', faq: 'FAQ', converter: 'Převodník' }[activeTab]}"...`} // číselníky
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Zde by mohly být filtry kategorií, pokud by byly potřeba
         <div className="relative">
           <button className="..."><Filter className="h-5 w-5" /> Filtrovat</button>
         </div>
        */}
      </div>
    )}


{/* --- Obsah jednotlivých záložek --- */}

{/* Obsah záložky Mapování endpointů */}
{activeTab === 'endpoints' && (
<div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
   {/* Tabulka endpointů s vylepšeným stylem a onClick z file 2 */}
   <table className="min-w-full divide-y divide-gray-200">
       <thead className="bg-gray-50">
         <tr>
            {/* Použití Tailwind tříd pro záhlaví */}
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">myAPI (SOAP)</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPL API (REST)</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Kategorie</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Klíčové rozdíly</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Detail</span></th>
         </tr>
       </thead>
        <tbody className="bg-white divide-y divide-gray-200">
        {filteredEndpoints.length === 0 ? (
           <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">Nebyly nalezeny žádné odpovídající endpointy pro '{searchTerm}'.</td></tr>
        ) : (
          filteredEndpoints.map((ep: Endpoint, index: number) => {
              // Najdi odpovídající fieldMapping ID
              const mappingId = Object.keys(apiData.fieldMappings).find(key => {
                const mapping = apiData.fieldMappings[key as keyof typeof apiData.fieldMappings];
                return mapping.soapOperation === ep.soapOperation && mapping.restEndpoint === ep.restEndpoint;
            });
              const hasDetail = !!mappingId;

              return (
                <tr key={index} id={`endpoint-row-${index}`}
                    className={`group hover:bg-blue-50 transition-colors duration-150 ${hasDetail ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                        if (mappingId) {
                            // Přidáme malé zpoždění pro animaci (z file 2)
                            const row = document.getElementById(`endpoint-row-${index}`);
                            if (row) row.classList.add('bg-blue-100');
                            setTimeout(() => {
                              setSelectedFieldMapping(mappingId);
                              setActiveTab('fields');
                              if (row) row.classList.remove('bg-blue-100');
                            }, 150);
                        }
                    }}
                >
                  <td className="px-6 py-4 whitespace-normal align-top">
                      <div className="text-sm font-semibold text-gray-900">{ep.soapOperation}</div>
                      <div className="text-xs text-gray-500 mt-1">{ep.soapDescription}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-normal align-top">
                      <div className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                          <span>{ep.restEndpoint}</span>
                          {ep.docUrl && (
                              <a href={ep.docUrl.startsWith('http') ? ep.docUrl : '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-500 hover:text-blue-700 flex-shrink-0" title="Dokumentace"><ExternalLink size={14} strokeWidth={2}/></a>
                          )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{ep.restDescription}</div>
                  </td>
                   <td className="px-6 py-4 text-sm text-gray-500 align-top hidden md:table-cell">
                      {apiData.categories.find(c => c.id === ep.category)?.name}
                   </td>
                   <td className="px-6 py-4 text-sm text-gray-500 align-top max-w-xs">
                      <div className="break-words">{ep.mainDifferences}</div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                      {hasDetail && (
                        <div className="flex items-center justify-end text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <span className="text-xs mr-1 hidden lg:inline">Detail</span>
                          <ArrowRight size={16} strokeWidth={2}/>
                        </div>
                      )}
                    </td>
                </tr>
              );
            })
        )}
        </tbody>
   </table>
</div>
)}

{/* Obsah záložky Porovnání polí */}
{activeTab === 'fields' && (
 <div>
    {!selectedFieldMapping ? (
        <div className="text-center py-12 text-gray-500">
          <Info size={24} className="mx-auto mb-2 text-gray-400"/>
          Pro zobrazení porovnání polí vyberte nejprve operaci v záložce <button onClick={() => setActiveTab('endpoints')} className="text-blue-600 hover:underline font-medium">Endpointy</button>.
        </div>
     ) : (
        (() => {
            const mapping = apiData.fieldMappings[selectedFieldMapping as keyof typeof apiData.fieldMappings];
            if (!mapping) return <div className="text-center py-8 text-red-500"><AlertCircle size={18} className="inline mr-1"/> Mapování nebylo nalezeno.</div>;
            const filteredFields = getFilteredFields(selectedFieldMapping);
            return (
              <>
                    {/* Hlavička porovnání polí (z file 2) */}
                    <div className="mb-6 pb-4 border-b border-gray-200">
                      <h2 className="text-xl font-bold text-gray-900">{mapping.title}</h2>
                      <p className="text-sm text-gray-600 mt-1">{mapping.description}</p>
                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs">
                          <div className="flex items-center">
                              <span className="font-semibold text-gray-600 mr-1">SOAP:</span>
                              <span className="text-gray-800 font-mono">{mapping.soapOperation}</span>
                          </div>
                          <div className="flex items-center">
                              <span className="font-semibold text-gray-600 mr-1">REST:</span>
                              <span className="text-blue-700 font-mono flex items-center gap-1">
                                  {mapping.restEndpoint}
                                  {mapping.docUrl && (
                                    <a href={mapping.docUrl.startsWith('http') ? mapping.docUrl : '#'} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700" title="Dokumentace"><ExternalLink size={14} strokeWidth={2}/></a>
                                  )}
                              </span>
                          </div>
                      </div>
                   </div>

                    {/* Tabulka porovnání polí (z file 2) */}
                    <div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200 mb-6">
                       <table className="min-w-full divide-y divide-gray-200">
                           <thead className="bg-gray-50">
                              <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">myAPI pole</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPL API pole</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datový typ</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Povinné</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Max. délka</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Popis</th>
                              </tr>
                           </thead>
                           <tbody className="bg-white divide-y divide-gray-200">
                           {filteredFields.length === 0 ? (
                              <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">Nebyly nalezeny žádné odpovídající pole pro '{searchTerm}'.</td></tr>
                           ) : (
                            filteredFields.map((field: Field, idx: number) => {
                                   const diff = highlightDifferences(field);
                                   return (
                                      <tr key={idx} className={`${diff.hasAnyDiff ? 'bg-yellow-50 hover:bg-yellow-100' : 'hover:bg-gray-50'} transition-colors duration-150`}>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900 align-top font-mono">{field.soapField}</td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm text-blue-700 align-top font-mono">{field.restField}</td>
                                          <td className={`px-4 py-2 whitespace-nowrap text-sm align-top ${diff.hasTypeDiff ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                              {field.soapType}{diff.hasAnyDiff ? <span className="text-red-600 mx-1">→</span> : <span className="text-gray-400 mx-1">→</span>}{field.restType}
                                          </td>
                                          <td className={`px-4 py-2 whitespace-nowrap text-sm align-top ${diff.hasRequiredDiff ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                              {field.soapRequired ? 'Ano' : 'Ne'}{diff.hasAnyDiff ? <span className="text-red-600 mx-1">→</span> : <span className="text-gray-400 mx-1">→</span>}{field.restRequired ? 'Ano' : 'Ne'}
                                          </td>
                                          <td className={`px-4 py-2 whitespace-nowrap text-sm align-top ${diff.hasLengthDiff ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                              {field.soapLength}{diff.hasAnyDiff ? <span className="text-red-600 mx-1">→</span> : <span className="text-gray-400 mx-1">→</span>}{field.restLength}
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-500 align-top whitespace-normal">{field.notes}</td>
                                      </tr>
                                   );
                               })
                           )}
                           </tbody>
                       </table>
                   </div>
                    {/* Vysvětlivky (z file 2) */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
                        <div className="flex items-center mb-2"> <Info size={16} className="text-gray-400 mr-2 flex-shrink-0"/> <span className="font-medium text-gray-700">Vysvětlivky:</span> </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-1">
                            <div className="flex items-center"><span className="inline-block w-3 h-3 bg-yellow-100 border border-yellow-300 rounded-full mr-2"></span>Žlutý řádek = pole s rozdíly</div>
                            <div className="flex items-center"><span className="text-red-600 font-semibold mr-1">Červený text</span> = konkrétní rozdíl</div>
                            <div className="flex items-center"><span className="text-red-600 mx-1">→</span>Šipka = změna SOAP → REST</div>
                        </div>
                    </div>
                </>
            );
        })()
    )}
 </div>
)}

{/* Obsah záložky Číselníky
{activeTab === 'codelist' && (
<div className="overflow-x-auto shadow-sm rounded-lg border border-gray-200">
  
  <table className="min-w-full divide-y divide-gray-200">
       <thead className="bg-gray-50">
         <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">myAPI (SOAP)</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPL API (REST)</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Popis</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Poznámka</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Detail</span></th>
         </tr>
       </thead>
        <tbody className="bg-white divide-y divide-gray-200">
         {codelistEndpoints.length === 0 ? (
            <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">Nebyly nalezeny žádné odpovídající číselníky pro '{searchTerm}'.</td></tr>
         ) : (
          codelistEndpoints.map((endpoint: Endpoint, index: number) => {
               // Najdi odpovídající fieldMapping ID
              const mappingId = Object.keys(apiData.fieldMappings).find(key => {
                  const mapping = apiData.fieldMappings[key as keyof typeof apiData.fieldMappings];
                  return mapping.soapOperation === endpoint.soapOperation || mapping.restEndpoint === endpoint.restEndpoint;
              });
              const hasDetail = !!mappingId;
              const isRestOnly = endpoint.soapOperation === 'N/A';

              return (
                 <tr key={index}
                     className={`group transition-colors duration-150 ${isRestOnly ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'} ${hasDetail ? 'cursor-pointer' : ''}`}
                     onClick={() => {
                        if (mappingId) {
                            // Přechod na detail pole
                            const row = document.getElementById(`codelist-row-${index}`); // Potřeba přidat ID
                            if (row) row.classList.add('bg-blue-100'); // Vizuální zpětná vazba
                            setTimeout(() => {
                                setSelectedFieldMapping(mappingId);
                                setActiveTab('fields');
                                if (row) row.classList.remove('bg-blue-100');
                            }, 150);
                        }
                    }}
                  >
                    <td className="px-6 py-4 whitespace-normal align-top">
                        {isRestOnly ? (
                           <span className="text-xs text-gray-400 italic">Nepodporováno</span>
                        ) : (
                           <>
                              <div className="text-sm font-semibold text-gray-900">{endpoint.soapOperation}</div>
                              <div className="text-xs text-gray-500 mt-1">{endpoint.soapDescription}</div>
                           </>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-normal align-top">
                        <div className="text-sm font-semibold text-blue-700 flex items-center gap-1">
                           <span>{endpoint.restEndpoint}</span>
                           {endpoint.docUrl && (
                              <a href={endpoint.docUrl.startsWith('http') ? endpoint.docUrl : '#'} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-blue-500 hover:text-blue-700 flex-shrink-0" title="Dokumentace"><ExternalLink size={14} strokeWidth={2}/></a>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{endpoint.restDescription}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 align-top hidden sm:table-cell">
                        {apiData.categories.find(c => c.id === endpoint.category)?.description}
                    </td>
                     <td className="px-6 py-4 text-sm text-gray-500 align-top max-w-xs">
                        <div className="break-words">{endpoint.mainDifferences}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium align-top">
                      {hasDetail && (
                        <div className="flex items-center justify-end text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <span className="text-xs mr-1 hidden lg:inline">Detail</span>
                          <ArrowRight size={16} strokeWidth={2}/>
                        </div>
                      )}
                    </td>
                </tr>
              );
            })
         )}
        </tbody>
  </table>
</div>
)} */}

{/* Obsah záložky Obecné rozdíly */}
{activeTab === 'differences' && (
 <div className="space-y-4">
    {/* Zobrazení obecných rozdílů s možností rozbalení (z file 2) */}
    {apiData.generalDifferences
      .filter(diff => !searchTerm || diff.category.toLowerCase().includes(searchTerm.toLowerCase()) || diff.soapApproach.toLowerCase().includes(searchTerm.toLowerCase()) || diff.restApproach.toLowerCase().includes(searchTerm.toLowerCase()) || (diff.soapExample && diff.soapExample.toLowerCase().includes(searchTerm.toLowerCase())) || (diff.restExample && diff.restExample.toLowerCase().includes(searchTerm.toLowerCase())))
      .map((diff, index) => (
         <div key={index}
              className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                 diff.importance === 'high' ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-white'
              }`}
         >
            <button className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
               onClick={() => toggleDifference(index)}
            >
               <h3 className="text-base md:text-lg font-medium text-gray-900 flex items-center">
                  {diff.importance === 'high' && <span className="inline-block w-2 h-2 bg-orange-500 rounded-full mr-2 flex-shrink-0"></span>}
                  {diff.category}
               </h3>
               <span className="text-gray-500">
                   {expandedDifferences.includes(index) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
               </span>
            </button>

            {expandedDifferences.includes(index) && (
               <div className="px-4 pb-4 pt-2 border-t border-gray-200">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                       <div>
                           <h4 className="font-medium text-gray-700 mb-1 text-sm">myAPI (SOAP)</h4>
                           <p className="text-xs text-gray-600 mb-2">{diff.soapApproach}</p>
                           <div className="relative group/copy">
                               <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto font-mono max-h-60">{diff.soapExample || 'N/A'}</pre>
                               {diff.soapExample && (
                                <button onClick={(e) => { e.stopPropagation(); copyToClipboard(diff.soapExample, `soap-${index}`); }}
                                   className={`absolute top-1 right-1 ${copiedButtonId === `soap-${index}` ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'} p-1 rounded text-[10px] leading-none opacity-0 group-hover/copy:opacity-100 transition-opacity`}
                                   title="Kopírovat"
                                >
                                    {copiedButtonId === `soap-${index}` ? <Check size={12}/> : <Copy size={12}/>}
                                </button>
                               )}
                           </div>
                       </div>
                       <div>
                           <h4 className="font-medium text-gray-700 mb-1 text-sm">CPL API (REST)</h4>
                           <p className="text-xs text-gray-600 mb-2">{diff.restApproach}</p>
                           <div className="relative group/copy">
                               <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto font-mono max-h-60">{diff.restExample || 'N/A'}</pre>
                                {diff.restExample && (
                                    <button onClick={(e) => { e.stopPropagation(); copyToClipboard(diff.restExample, `rest-${index}`); }}
                                        className={`absolute top-1 right-1 ${copiedButtonId === `rest-${index}` ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'} p-1 rounded text-[10px] leading-none opacity-0 group-hover/copy:opacity-100 transition-opacity`}
                                        title="Kopírovat"
                                    >
                                        {copiedButtonId === `rest-${index}` ? <Check size={12}/> : <Copy size={12}/>}
                                    </button>
                                )}
                           </div>
                       </div>
                   </div>
               </div>
            )}
         </div>
      ))
    }
    {/* Sekce doporučení pro migraci (z file 2) */}
    <div className="mt-8 p-5 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">Doporučení pro migraci</h2>
        <div className="space-y-3 text-sm text-gray-700">
            <div>
               <h4 className="font-medium text-gray-800">1. Autentizace</h4>
               <ul className="list-disc pl-5 mt-1 text-xs space-y-0.5">
                   <li>Implementujte OAuth2/JWT (client_id, client_secret, Bearer token).</li>
                   <li>Nahraďte SOAP Auth element voláním endpointu pro získání tokenu.</li>
               </ul>
            </div>
            <div>
               <h4 className="font-medium text-gray-800">2. Požadavky a odpovědi</h4>
               <ul className="list-disc pl-5 mt-1 text-xs space-y-0.5">
                   <li>Přejděte z XML na JSON.</li>
                   <li>Změňte názvy polí z PascalCase na camelCase.</li>
                   <li>Ověřte a implementujte nové povinné pole a délková omezení v REST API.</li>
                   <li>Zpracovávejte HTTP stavové kódy a JSON chybové objekty místo SOAP Faults.</li>
               </ul>
            </div>
            <div>
               <h4 className="font-medium text-gray-800">3. Endpointy a operace</h4>
               <ul className="list-disc pl-5 mt-1 text-xs space-y-0.5">
                   <li>Mapujte SOAP operace na odpovídající REST endpointy a HTTP metody (GET, POST, PUT, atd.).</li>
                   <li>Aktualizujte volání API dle REST architektury (resource-oriented URLs).</li>
                   <li>Sjednoťte volání číselníků na /codelist/* endpointy.</li>
                 </ul>
              </div>
          </div>
      </div>
   </div>
)}

       {/* Obsah záložky Příklady */}
       {activeTab === 'examples' && (
  <div>
     {/* Zobrazení příkladů (upraveno) */}
     <h2 className="text-xl font-bold text-gray-900 mb-2">Příklady komplexních struktur API</h2>
     <p className="mb-6 text-sm text-gray-600">Ukázky složitějších REST API struktur, které je obtížné konvertovat z/do SOAP formátu.</p>
     <div className="space-y-6">
        {apiData.apiExamples.map((example) => (
           <div key={example.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 bg-white">
              <div className="px-4 py-4">
                 <div className="flex justify-between">
                    <span className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{example.category}</span>
                    <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">Složitost: {example.complexity === 'complex' ? 'Vysoká' : example.complexity === 'medium' ? 'Střední' : 'Nízká'}</span>
                 </div>
                 <h3 className="mt-2 text-base font-semibold text-gray-900">{example.title}</h3>
                 <p className="mt-1 text-xs text-gray-500">{example.description}</p>
                 {example.endpoint && (
                   <div className="mt-2 flex items-center text-xs text-blue-600 font-mono">
                     <span className={`font-bold mr-1 ${example.method === 'POST' ? 'text-green-700' : 'text-blue-700'}`}>{example.method}</span>
                     <span>{example.endpoint}</span>
                   </div>
                 )}
              </div>
              {example.requestBody && (
                <div className="px-4 pb-4">
                     <div className="relative group/copy">
                       <pre className="text-[11px] bg-gray-800 text-white p-3 rounded overflow-x-auto font-mono max-h-96">{example.requestBody}</pre>
                       <button onClick={() => copyToClipboard(example.requestBody, `ex-${example.id}`)}
                          className={`absolute top-1 right-1 ${copiedButtonId === `ex-${example.id}` ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300 hover:bg-gray-500 hover:text-white'} p-1 rounded text-[10px] leading-none opacity-0 group-hover/copy:opacity-100 transition-opacity`}
                          title="Kopírovat kód"
                       >
                          {copiedButtonId === `ex-${example.id}` ? <Check size={12}/> : <Copy size={12}/>}
                       </button>
                     </div>
                </div>
              )}
           </div>
        ))}
     </div>
  </div>
)}

       {/* Obsah záložky FAQ */}
       {activeTab === 'faq' && (
          <div>
              {/* Zobrazení FAQ (z file 2) */}
              <h2 className="text-xl font-bold text-gray-900 mb-2">Často kladené dotazy (FAQ)</h2>
              <p className="mb-6 text-sm text-gray-600">Odpovědi na běžné otázky týkající se CPL API a migrace.</p>
              <div className="space-y-3">
                {apiData.faqItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                        <button className="w-full px-4 py-3 flex justify-between items-center text-left hover:bg-gray-50"
                           onClick={() => setExpandedFaq(prev => prev === item.id ? null : item.id)}
                        >
                           <span className="text-sm font-medium text-gray-900">{item.question}</span>
                           <span className="ml-4 text-gray-400 flex-shrink-0">
                               {expandedFaq === item.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                           </span>
                        </button>
                        {expandedFaq === item.id && (
                            <div className="px-4 pb-4 pt-2 border-t border-gray-200">
                               {/* Použití `whitespace-pre-line` pro zachování odřádkování v odpovědi */}
                               <p className="text-xs text-gray-600 whitespace-pre-line">{item.answer}</p>
                            </div>
                        )}
                    </div>
                ))}
              </div>
          </div>
       )}

    {/* Obsah záložky Převodník SOAP na REST */}
          {activeTab === 'converter' && (
            <div className="mt-2">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Experimentální SOAP → REST Převodník</h2>
              
              {/* Tabulka podporovaných operací */}
              <div className="mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">Podporované operace</h3>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SOAP Operace</th>
                      <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REST Endpoint</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-sm">
                    <tr id="converter-CreatePackages" className={`${restOutput?.operation === 'CreatePackages' ? 'bg-green-50' : ''}`}>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                        {restOutput?.operation === 'CreatePackages' ? <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span> : <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>}
                        CreatePackages
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">POST /shipment/batch</td>
                    </tr>
                    <tr id="converter-CreateOrders" className={`${restOutput?.operation === 'CreateOrders' ? 'bg-green-50' : ''}`}>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                        {restOutput?.operation === 'CreateOrders' ? <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span> : <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>}
                        CreateOrders
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">POST /order/batch</td>
                    </tr>
                    <tr id="converter-CreatePickupOrders" className={`${restOutput?.operation === 'CreatePickupOrders' ? 'bg-green-50' : ''}`}>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                        {restOutput?.operation === 'CreatePickupOrders' ? <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span> : <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>}
                        CreatePickupOrders
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">POST /order/batch</td>
                    </tr>
                    <tr id="converter-GetPackages" className={`${restOutput?.operation === 'GetPackages' ? 'bg-green-50' : ''}`}>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                        {restOutput?.operation === 'GetPackages' ? <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span> : <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>}
                        GetPackages
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">GET /shipment</td>
                    </tr>
                    <tr id="converter-CancelPackage" className={`${restOutput?.operation === 'CancelPackage' ? 'bg-green-50' : ''}`}>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                        {restOutput?.operation === 'CancelPackage' ? <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span> : <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>}
                        CancelPackage
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">POST /shipment/{'{shipmentNumber}'}/cancel</td>
                    </tr>
                    <tr id="converter-UpdatePackage" className={`${restOutput?.operation === 'UpdatePackage' ? 'bg-green-50' : ''}`}>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                        {restOutput?.operation === 'UpdatePackage' ? <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span> : <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>}
                        UpdatePackage
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">POST /shipment/{'{shipmentNumber}'}/redirect</td>
                    </tr>
                    <tr id="converter-GetOrders" className={`${restOutput?.operation === 'GetOrders' ? 'bg-green-50' : ''}`}>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                        {restOutput?.operation === 'GetOrders' ? <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span> : <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>}
                        GetOrders
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">GET /order</td>
                    </tr>
                    <tr id="converter-CancelOrder" className={`${restOutput?.operation === 'CancelOrder' ? 'bg-green-50' : ''}`}>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                        {restOutput?.operation === 'CancelOrder' ? <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span> : <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>}
                        CancelOrder
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">POST /order/cancel</td>
                    </tr>
                    <tr id="converter-GetParcelShops" className={`${restOutput?.operation === 'GetParcelShops' ? 'bg-green-50' : ''}`}>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs font-medium">
                        {restOutput?.operation === 'GetParcelShops' ? <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-1.5"></span> : <span className="inline-block w-2 h-2 bg-gray-300 rounded-full mr-1.5"></span>}
                        GetParcelShops
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-xs text-blue-600">GET /accessPoint</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Nastavení převodníku */}
              <div className="mb-6 bg-white border border-gray-200 rounded-lg">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">Nastavení převodníku</h3>
                </div>
                <div className="p-4">
                  <div className="flex flex-col space-y-4">
                    <div>
                      <label htmlFor="baseUrlInput" className="block text-sm font-medium text-gray-700 mb-1">Základní URL pro CPL REST API:</label>
                      <input 
                        id="baseUrlInput" 
                        type="text" 
                        className="input w-full p-2 border border-gray-300 rounded-md text-sm" 
                        value={converterBaseUrl} 
                        onChange={(e) => setConverterBaseUrl(e.target.value)} 
                      />
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-md p-3 text-xs text-orange-700">
                      <strong>Upozornění:</strong> Jedná se o zjednodušený převodník pro demonstrační účely. Výsledek nemusí být 100% přesný nebo kompletní, zejména u složitějších struktur.
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stav konverze - zobrazí se pouze při úspěšné konverzi */}
              {restOutput && restOutput.success && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg">
                  <div className="px-4 py-3 flex items-center">
                    <Check size={20} className="mr-3 text-green-600 flex-shrink-0"/>
                    <div>
                      <h3 className="text-sm font-semibold text-green-800">Konverze úspěšná</h3>
                      <p className="text-xs text-green-700 mt-0.5">
                        SOAP operace <span className="font-mono font-medium">{restOutput.operation}</span> byla převedena na REST
                      </p>
                    </div>
                  </div>
                  <div className="border-t border-green-200 px-4 py-3">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-700 w-16">Metoda:</span>
                        <span className={`text-xs font-mono font-semibold ${restOutput.method === 'POST' ? 'text-green-600' : 'text-blue-600'}`}>
                          {restOutput.method}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-700 w-16">Endpoint:</span>
                        <span className="text-xs font-mono overflow-x-auto flex-grow">{converterBaseUrl}{restOutput.path}</span>
                      </div>
                    </div>
                    <button 
                      className="mt-2 text-xs flex items-center text-green-700 hover:text-green-900 bg-green-100 hover:bg-green-200 px-2 py-1 rounded" 
                      onClick={() => copyToClipboard(`${restOutput.method} ${converterBaseUrl}${restOutput.path}`, 'rest-url')}
                    >
                      {copiedButtonId === 'rest-url' ? <Check size={14} className="mr-1"/> : <Copy size={14} className="mr-1"/>}
                      Kopírovat celý endpoint
                    </button>
                  </div>
                </div>
              )}

              {/* Hlavní část převodníku - dva sloupce */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Levá strana: Vstup SOAP */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-700">SOAP XML Požadavek</h3>
                    <button 
                      className="text-xs text-gray-500 hover:text-gray-700" 
                      onClick={resetConverterForm} 
                      disabled={!soapInput && !restOutput}
                    >
                      Resetovat
                    </button>
                  </div>
                  <div className="p-4">
                    <textarea
                      className="w-full min-h-[350px] p-3 font-mono text-sm bg-gray-50 border border-gray-300 rounded-md resize-none"
                      value={soapInput}
                      onChange={(e) => setSoapInput(e.target.value)}
                      placeholder="Vložte SOAP XML požadavek..."
                      spellCheck={false}
                    />
                    <button 
                      className="mt-4 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center text-sm font-medium" 
                      onClick={handleTransform} 
                      disabled={!soapInput.trim()}
                    >
                      <ArrowRight size={18} className="mr-1"/> Transformovat na REST
                    </button>
                  </div>
                </div>

                {/* Pravá strana: Výstup REST */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">REST Ekvivalent</h3>
                  </div>
                  <div className="p-4">
                    {/* Podmíněné renderování výstupu */}
                    {restOutput === null ? (
                      <div className="flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-md p-6 min-h-[350px]">
                        <div className="text-center text-gray-500">
                          <p className="text-sm">Transformovaný REST JSON výsledek se zobrazí zde.</p>
                          <p className="text-xs mt-2">Vložte SOAP XML a klikněte na tlačítko "Transformovat".</p>
                        </div>
                      </div>
                    ) : !restOutput.success ? (
                      <div className="flex items-start bg-red-50 border border-red-200 rounded-md p-4 min-h-[350px]">
                        <AlertCircle size={18} className="mr-2 flex-shrink-0 text-red-600"/> 
                        <div>
                          <p className="text-sm font-medium text-red-800">Chyba při konverzi</p>
                          <p className="text-xs text-red-700 mt-1">{restOutput.error}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="min-h-[350px] flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-medium text-gray-700">Body (JSON):</h4>
                          <button 
                            className="text-xs flex items-center text-blue-600 hover:text-blue-800" 
                            onClick={() => copyToClipboard(JSON.stringify(restOutput.body, null, 2), 'rest-body')}
                          >
                            {copiedButtonId === 'rest-body' ? <Check size={14} className="mr-1"/> : <Copy size={14} className="mr-1"/>}
                            Kopírovat JSON
                          </button>
                        </div>
                        {/* Skrolovatelný pre blok */}
                        <div className="flex-grow border border-gray-200 rounded-md bg-gray-50 overflow-auto">
                          <pre className="p-3 text-xs font-mono">
                            {JSON.stringify(restOutput.body, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

    </div> // Konec hlavního kontejneru
  );
// Uzavření komponenty
};

// Export komponenty (nechybí už default export)
export default ApiComparisonConverter;