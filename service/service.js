const axios = require("axios");
const moment = require("moment");
const { formatDate, calcTimeInterval } = require('./util');
// const sql = require("../config/mySql");
const options = { method: 'GET', headers: { Accept: 'application/json', 'X-API-KEY': '7c01ed670df3403bb8105e5587f93d7f' } };
const LimitNumber = 200;
const ItemNumber = 8;
const MiniInterval = 60;
const { calculatorBuyRank } = require('./api');
const UpdateInterval = 86400000;
const defaultContractAddress = "0xf76179bb0924ba7da8e7b7fc2779495d7a7939d8";
const defaultTimeInterval = "1200";
const defaultpriceInterval = "0.0001";
const from = "2022-07-12";
const to = "2022-08-19";
const Client = require("../client/client");
var presetArray = [
    { preset: "chrome62", ua: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.9 Safari/537.36" },
    { preset: "chrome70", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36" },
    { preset: "chrome72", ua: "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Safari/537.36" },
    { preset: "chrome83", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.106 Whale/2.8.107.17 Safari/537.36" },
    { preset: "firefox55", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.13; rv:55.0) Gecko/20100101 Firefox/55.0" },
    { preset: "firefox56", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_2; rv:56.0.2) Gecko/20100101 Firefox/56.0.2" },
    { preset: "firefox63", ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.14; rv:63.0) Gecko/20100101 Firefox/63.0" },
]
function intervalFunc() {
    // saveSalesData(defaultContractAddress, defaultTimeInterval);
    // saveListingData(defaultContractAddress, defaultTimeInterval);
    // assetsForSales(defaultContractAddress, defaultTimeInterval);
    // getSellWall(defaultContractAddress, defaultpriceInterval);
    // getHolderInfoByTime(defaultContractAddress, from, to);
}
// setInterval(intervalFunc, UpdateInterval);

const delay = (time) => {
    return new Promise((resolve) => setTimeout(resolve, time));
}

const getCollectionInfoV1 = async (pageNumber, pageLimit) => {
    const collectionData = (await axios.get(`https://api.opensea.io/api/v1/collections?offset=${pageNumber}&limit=${LimitNumber}`, options)).data;
    console.log(collectionData);
    const response = {};
    const key = "collectionsInfo";
    response[key] = [];
    collectionData.collections.map(item => {
        if (item['primary_asset_contracts'] != null && item['primary_asset_contracts'] != [] && item['primary_asset_contracts'].length > 0) {
            response[key].push(item);
        }
    })
    return response;
}




const getEvent = async (params) => {

    // start_date = '', end_date = '', cursor = '',  event_type = 'created', contract_address
    var start_date = params.start_date || ""
        , end_date = params.end_date || ""
        , cursor = params.cursor || ""
        , event_type = params.event_type || "created"
        , contract_address = params.contract_address || "";
    let url = `https://api.opensea.io/api/v1/events?asset_contract_address=${contract_address}&limit=${LimitNumber}&event_type=${event_type}&cursor=${cursor}`;

    if (start_date != "") {
        url = `https://api.opensea.io/api/v1/events?occurred_before=${end_date}&occurred_after=${start_date}&asset_contract_address=${contract_address}&limit=${LimitNumber}&event_type=${event_type}&cursor=${cursor}`
    }

    const collectionStats = (await axios.get(url, options)).data;
    // console.log(collectionStats);
    return collectionStats;

}

const getAllEvents = async (options) => {

    // start_date = '', end_date = '', event_type = 'created', contract_address
    var start_date = options.start_date || ""
        , end_date = options.end_date || ""
        , total_limit = options.total_limit || -1
        , event_type = options.event_type || "created"
        , contract_address = options.contract_address || "";
    let result = [];
    let next = ''
    let fetch = true

    while (fetch) {

        let collectionstats = await getEvent({ start_date: start_date, end_date: end_date, cursor: next, contract_address: contract_address });

        if (collectionstats['next'] == undefined) {
            fetch = false;
        }
        else {
            next = collectionstats['next'];

        }


        result = result.concat(collectionstats.asset_events);
        if (total_limit != -1) {
            if (result.length > total_limit) {
                console.log("return");
                fetch = false;
            }
        }
    }
    return result;
    //         response = get_events(start_date, end_date, cursor = next, ** kwargs)
    //     print(response)

    //     for event in response['asset_events']:
    //         cleaned_event = parse_event(event)

    //     if cleaned_event != None:
    //         result.append(cleaned_event)

    //     if response['next'] is None:
    //     fetch = False
    //         else:
    // next = response['next']

    // sleep(pause)

    // return result
}
const getSalesDataAssets = async (contractAddress, start_date, end_date) => {
    console.log(contractAddress);
    let index = 0;
    let collectionData = [];
    let next = null;
    let response = [];
    var payload = JSON.stringify({
        "query": "query ($filter: LogsFilterInputType, $after: String, $first: Int) {\r\n  logs(filter: $filter, after: $after, first: $first) {\r\n    edges {\r\n      node {\r\n        fromAddress\r\n        toAddress\r\n        estimatedConfirmedAt\r\n      }\r\n    }\r\n    pageInfo {\r\n      hasNextPage\r\n      hasPreviousPage\r\n      startCursor\r\n      endCursor\r\n    }\r\n  }\r\n}\r\n",
        "variables": {
            "filter": {
                "typeIn": "ORDER",
                "contractAddress": {
                    "eq": contractAddress
                },
                "estimatedConfirmedAt": {
                    "gt": start_date,
                    "lte": end_date
                }
            },
            "after": next,
            "first": 50
        }
    });

    var config = {
        method: 'post',
        url: 'https://graphql.icy.tools/graphql',
        headers: {
            'authority': 'graphql.icy.tools',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json',
            'origin': 'https://developers.icy.tools',
            'referer': 'https://developers.icy.tools/',
            'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
            'x-api-key': '16db3318d1fb47d0822f65d62fc6f2a1'
        },
        data: payload
    };


    while (true) {
        try {
            payload = JSON.stringify({
                "query": "query ($filter: LogsFilterInputType, $after: String, $first: Int) {\r\n  logs(filter: $filter, after: $after, first: $first) {\r\n    edges {\r\n      node {\r\n        fromAddress\r\n        toAddress\r\n        estimatedConfirmedAt\r\n      }\r\n    }\r\n    pageInfo {\r\n      hasNextPage\r\n      hasPreviousPage\r\n      startCursor\r\n      endCursor\r\n    }\r\n  }\r\n}\r\n",
                "variables": {
                    "filter": {
                        "typeIn": "ORDER",
                        "contractAddress": {
                            "eq": contractAddress
                        },
                        "estimatedConfirmedAt": {
                            "gt": start_date,
                            "lte": end_date
                        }
                    },
                    "after": next,
                    "first": 10
                }
            });
            config = {
                method: 'post',
                url: 'https://graphql.icy.tools/graphql',
                headers: {
                    'authority': 'graphql.icy.tools',
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                    'origin': 'https://developers.icy.tools',
                    'referer': 'https://developers.icy.tools/',
                    'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-site',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
                    'x-api-key': '16db3318d1fb47d0822f65d62fc6f2a1'
                },
                data: payload
            };
            try {
                collectionData = (

                    await axios(config)
                ).data.data.logs;
            }
            catch (e) {
                console.log(e);
                continue;
            }


            if (collectionData.pageInfo.hasNextPage == false) {
                collectionData = collectionData.edges;
                collectionData.forEach((element, index) => {
                    response.push(
                        element.node
                    );
                }

                )
                break;
            }
            else {
                next = collectionData.pageInfo.endCursor;
            }
            collectionData = collectionData.edges;
            collectionData.forEach((element, index) => {
                response.push(
                    element.node
                );
            }

            )
            return response;
            // index += 50;
        } catch (err) {
            console.log("err", err);
            break;
        }
    }
    return response;



}
// query Contract($address: String!, $after: String, $first: Int, $filter: LogsFilterInputType) {  contract(address: $address) {    address    tokens(after: $after, first: $first) {      edges {        node {          tokenId          ... on ERC721Token {            ownerAddress\\r\\n  logs(filter: $filter) {\\r\\n    edges {\\r\\n      node {\\r\\n        estimatedConfirmedAt\\r\\n        toAddress\\r\\n      }\\r\\n    }\\r\\n  }\\r\\n}\\r\\n}      }      pageInfo {       hasNextPage        hasPreviousPage        startCursor        endCursor     }    }\\r

const getSalesLiveData = async (contractAddress) => {
    console.log(contractAddress);
    let index = 0;
    let collectionData = [];
    let next = null;
    let response = [];
    // JSON.stringify({
    //     "query": "query ($filter: LogsFilterInputType, $after: String, $first: Int) {\r\n  logs(filter: $filter, after: $after, first: $first) {\r\n    edges {\r\n      node {\r\n        fromAddress\r\n        toAddress\r\n        estimatedConfirmedAt\r\n      }\r\n    }\r\n    pageInfo {\r\n      hasNextPage\r\n      hasPreviousPage\r\n      startCursor\r\n      endCursor\r\n    }\r\n  }\r\n}\r\n",
    //     "variables": {
    //         "filter": {
    //             "typeIn": "ORDER",
    //             "contractAddress": {
    //                 "eq": contractAddress
    //             },

    //         },
    //         "after": next,
    //         "first": 50
    //     }
    // });

    var payload = JSON.stringify({
        "query": "query($after: String, $first: Int, $filter: LogsFilterInputType)  {\r\n  logs(after: $after, first: $first, filter: $filter) {\r\n    edges {\r\n      node {\r\n        fromAddress\r\n        toAddress\r\n        transaction {\r\n          valueInEth\r\n          transactionFeeInEth\r\n          maxGasFee\r\n          maxGasPriorityFee\r\n          gasUsed\r\n          gasPrice\r\n          gasLimit\r\n        }\r\n        token {\r\n          images {\r\n            url\r\n          }\r\n        }\r\n        estimatedConfirmedAt\r\n      }\r\n    }\r\n  }\r\n}",
        "variables": {
            "first": 8,
            "after": null,
            "filter": {
                "typeIn": "ORDER",
                "contractAddress": {
                    "eq": contractAddress
                }
            }
        }
    });

    var config = {
        method: 'post',
        url: 'https://graphql.icy.tools/graphql',
        headers: {
            'authority': 'graphql.icy.tools',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json',
            'origin': 'https://developers.icy.tools',
            'referer': 'https://developers.icy.tools/',
            'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
            'x-api-key': '16db3318d1fb47d0822f65d62fc6f2a1'
        },
        data: payload
    };


    while (true) {
        try {
            // JSON.stringify({
            //     "query": "query($after: String, $first: Int, $filter: LogsFilterInputType)  {\r\n  logs(after: $after, first: $first, filter: $filter) {\r\n    edges {\r\n      node {\r\n        fromAddress\r\n        toAddress\r\n        transaction {\r\n          valueInEth\r\n          transactionFeeInEth\r\n          maxGasFee\r\n          maxGasPriorityFee\r\n          gasUsed\r\n          gasPrice\r\n          gasLimit\r\n        }\r\n        token {\r\n          images {\r\n            url\r\n          }\r\n        }\r\n        estimatedConfirmedAt\r\n      }\r\n    }\r\n  }\r\n}",
            //     "variables": {
            //         "first": 50,
            //         "after": null,
            //         "filter": {
            //             "typeIn": "ORDER",
            //             "contractAddress": {
            //                 "eq": contractAddress
            //             }
            //         }
            //     }
            // });
            var payload = JSON.stringify({
                "query": "query($after: String, $first: Int, $filter: LogsFilterInputType)  {\r\n  logs(after: $after, first: $first, filter: $filter) {\r\n    edges {\r\n      node {\r\n        fromAddress\r\n        toAddress\r\n        transaction {\r\n          valueInEth\r\n          transactionFeeInEth\r\n          maxGasFee\r\n          maxGasPriorityFee\r\n          gasUsed\r\n          gasPrice\r\n          gasLimit\r\n        }\r\n        token {\r\n          images {\r\n            url\r\n          }\r\n          tokenId\r\n      ... on ERC721Token {\r\n    name\r\n  }\r\n        }\r\n        estimatedConfirmedAt\r\n        contract {\r\n          ... on ERC721Contract {\r\n            name\r\n          }\r\n        }\r\n      }\r\n    }\r\n  }\r\n}",
                "variables": {
                    "first": 8,
                    "after": null,
                    "filter": {
                        "typeIn": "ORDER",
                        "contractAddress": {
                            "eq": contractAddress
                        }
                    }
                }
            });
            config = {
                method: 'post',
                url: 'https://graphql.icy.tools/graphql',
                headers: {
                    'authority': 'graphql.icy.tools',
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                    'origin': 'https://developers.icy.tools',
                    'referer': 'https://developers.icy.tools/',
                    'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-site',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
                    'x-api-key': '16db3318d1fb47d0822f65d62fc6f2a1'
                },
                data: payload
            };
            try {
                collectionData = (

                    await axios(config)
                ).data.data.logs;
            }
            catch (e) {
                console.log(e);
                continue;
            }


            // if (collectionData.pageInfo.hasNextPage == false) {
            //     collectionData = collectionData.edges;
            //     collectionData.forEach((element, index) => {
            //         response.push(
            //             element.node
            //         );
            //     }

            //     )
            //     break;
            // }
            // else {
            //     next = collectionData.pageInfo.endCursor;
            // }
            collectionData = collectionData.edges;
            let slug = (await getCollectionSlug(contractAddress)).slug;


            // const result = (await axios.get(`https://platinumtools.s3.ap-southeast-1.amazonaws.com/os-${slug}.json`)).data;
            var result = []

            try {
                result = (await axios.get(`https://platinumtools.s3.ap-southeast-1.amazonaws.com/os-${slug}.json`)).data;

                //check result data and call queue gather
                if (result === null || result == []) {
                    try {
                        axios.get(`https://qprbaee7t7.execute-api.us-east-1.amazonaws.com/Prod/api/oscollectionrefreshC?collection=${slug}`)
                    } catch { }
                }
            } catch { }

            const supply = await getSupply(contractAddress);
            // collectionData = collectionData.edges;
            collectionData.forEach((element, index) => {
                let obj = result.find(o => o.t === element.node.token.tokenId);

                element.node.type = "Nan"
                if (obj != undefined) {
                    element.node.rarity = parseInt(obj.r);
                    let p = (element.node.rarity / supply) * 100;
                    if (p < 2)
                        element.node.type = "Legendary";
                    else if (p < 8)
                        element.node.type = "Epic";
                    else if (p < 15)
                        element.node.type = "Rare";
                    else if (p < 25)
                        element.node.type = "Uncommon";
                    else
                        element.node.type = "Common";
                }
                response.push(
                    element.node
                );
            }

            )
            return response;
            // index += 50;
        } catch (err) {
            console.log("err", err);
            break;
        }
    }
    return response;



}

const getFeedsDataAssets = async (contractAddress) => {
    const collectionStats = (await axios.get(`https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&limit=${LimitNumber}&event_type=successful`, options)).data;

    const assetData = collectionStats["asset_events"];

    const feedsData = {};
    var key = "feeds";
    feedsData[key] = [];

    assetData.forEach(item => {
        if (feedsData[key].length < 8) {
            if (item['listing_time'] == null) {
                const record = {};
                record['type'] = 'ORDER';
                record['name'] = item['asset']['name'];
                record['image_url'] = item['asset']['image_url'];
                record['from'] = item['seller']['address'];
                record['to'] = item['winner_account']['address'];

                record['order_date'] = calcTimeInterval(new Date(item['event_timestamp']).getTime()).timeInterval + " " +
                    calcTimeInterval(new Date(item['event_timestamp']).getTime()).unit + ' ago';

                record['order_price'] = item['total_price'] / (10 ** 18) + " ETH";

                feedsData[key].push(record);
            }
        }
    });

    return feedsData;
}

const getListingDataAssets = async (contractAddress) => {
    let slug = (await getCollectionSlug(contractAddress)).slug;
    let assetData;
    while (true) {
        try {
            var randomNumber = Math.floor(Math.random() * presetArray.length);


            await this.client.init({
                type: "preset",
                preset: presetArray[randomNumber].preset,
            });
            let payload = JSON.stringify({
                "id": "EventHistoryQuery",
                "query": "query EventHistoryQuery(\n  $archetype: ArchetypeInputType\n  $bundle: BundleSlug\n  $collections: [CollectionSlug!]\n  $categories: [CollectionSlug!]\n  $chains: [ChainScalar!]\n  $eventTypes: [EventType!]\n  $cursor: String\n  $count: Int = 16\n  $showAll: Boolean = false\n  $identity: IdentityInputType\n) {\n  ...EventHistory_data_L1XK6\n}\n\nfragment AccountLink_data on AccountType {\n  address\n  config\n  isCompromised\n  user {\n    publicUsername\n    id\n  }\n  displayName\n  ...ProfileImage_data\n  ...wallet_accountKey\n  ...accounts_url\n}\n\nfragment AssetMediaAnimation_asset on AssetType {\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaAudio_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaContainer_asset_2V84VL on AssetType {\n  backgroundColor\n  ...AssetMediaEditions_asset_2V84VL\n}\n\nfragment AssetMediaEditions_asset_2V84VL on AssetType {\n  decimals\n}\n\nfragment AssetMediaImage_asset on AssetType {\n  backgroundColor\n  imageUrl\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaPlaceholderImage_asset on AssetType {\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaVideo_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaWebgl_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMedia_asset on AssetType {\n  animationUrl\n  displayImageUrl\n  imageUrl\n  isDelisted\n  ...AssetMediaAnimation_asset\n  ...AssetMediaAudio_asset\n  ...AssetMediaContainer_asset_2V84VL\n  ...AssetMediaImage_asset\n  ...AssetMediaPlaceholderImage_asset\n  ...AssetMediaVideo_asset\n  ...AssetMediaWebgl_asset\n}\n\nfragment CollectionCell_collection on CollectionType {\n  name\n  imageUrl\n  isVerified\n  ...collection_url\n}\n\nfragment CollectionCell_trait on TraitType {\n  traitType\n  value\n}\n\nfragment CollectionLink_assetContract on AssetContractType {\n  address\n  blockExplorerLink\n}\n\nfragment CollectionLink_collection on CollectionType {\n  name\n  slug\n  verificationStatus\n  ...collection_url\n}\n\nfragment EventHistory_data_L1XK6 on Query {\n  eventActivity(after: $cursor, bundle: $bundle, archetype: $archetype, first: $count, categories: $categories, collections: $collections, chains: $chains, eventTypes: $eventTypes, identity: $identity, includeHidden: true) {\n    edges {\n      node {\n        collection {\n          ...CollectionCell_collection\n          id\n        }\n        traitCriteria {\n          ...CollectionCell_trait\n          id\n        }\n        itemQuantity\n        item @include(if: $showAll) {\n          __typename\n          relayId\n          verificationStatus\n          ...ItemCell_data\n          ...item_url\n          ... on AssetType {\n            collection {\n              ...CollectionLink_collection\n              id\n            }\n            assetContract {\n              ...CollectionLink_assetContract\n              id\n            }\n          }\n          ... on AssetBundleType {\n            bundleCollection: collection {\n              ...CollectionLink_collection\n              id\n            }\n          }\n          ... on Node {\n            __isNode: __typename\n            id\n          }\n        }\n        relayId\n        eventTimestamp\n        eventType\n        orderExpired\n        customEventName\n        ...utilsAssetEventLabel\n        creatorFee {\n          unit\n        }\n        devFeePaymentEvent {\n          ...EventTimestamp_data\n          id\n        }\n        fromAccount {\n          address\n          ...AccountLink_data\n          id\n        }\n        perUnitPrice {\n          unit\n          eth\n          usd\n        }\n        endingPriceType {\n          unit\n        }\n        priceType {\n          unit\n        }\n        payment {\n          ...TokenPricePayment\n          id\n        }\n        seller {\n          ...AccountLink_data\n          id\n        }\n        toAccount {\n          ...AccountLink_data\n          id\n        }\n        winnerAccount {\n          ...AccountLink_data\n          id\n        }\n        ...EventTimestamp_data\n        id\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment EventTimestamp_data on AssetEventType {\n  eventTimestamp\n  transaction {\n    blockExplorerLink\n    id\n  }\n}\n\nfragment ItemCell_data on ItemType {\n  __isItemType: __typename\n  __typename\n  displayName\n  ...item_url\n  ... on AssetType {\n    ...AssetMedia_asset\n  }\n  ... on AssetBundleType {\n    assetQuantities(first: 30) {\n      edges {\n        node {\n          asset {\n            ...AssetMedia_asset\n            id\n          }\n          relayId\n          id\n        }\n      }\n    }\n  }\n}\n\nfragment ProfileImage_data on AccountType {\n  imageUrl\n}\n\nfragment TokenPricePayment on PaymentAssetType {\n  symbol\n  chain {\n    identifier\n  }\n  asset {\n    imageUrl\n    assetContract {\n      blockExplorerLink\n      id\n    }\n    id\n  }\n}\n\nfragment accounts_url on AccountType {\n  address\n  user {\n    publicUsername\n    id\n  }\n}\n\nfragment asset_url on AssetType {\n  assetContract {\n    address\n    id\n  }\n  tokenId\n  chain {\n    identifier\n  }\n}\n\nfragment bundle_url on AssetBundleType {\n  slug\n  chain {\n    identifier\n  }\n}\n\nfragment collection_url on CollectionType {\n  slug\n  isCategory\n}\n\nfragment item_url on ItemType {\n  __isItemType: __typename\n  __typename\n  ... on AssetType {\n    ...asset_url\n  }\n  ... on AssetBundleType {\n    ...bundle_url\n  }\n}\n\nfragment utilsAssetEventLabel on AssetEventType {\n  isMint\n  isAirdrop\n  eventType\n}\n\nfragment wallet_accountKey on AccountType {\n  address\n}\n",
                "variables": {
                    "archetype": null,
                    "bundle": null,
                    "collections": [
                        slug
                    ],
                    "categories": null,
                    "chains": null,
                    "eventTypes": [
                        "AUCTION_CREATED"
                    ],
                    "cursor": null,
                    "count": 16,
                    "showAll": true,
                    "identity": null
                }
            });

            res = await this.client.request({

                url: `https://opensea.io/__api/graphql/`,
                method: "POST",
                headers: [
                    ['authority', 'opensea.io'],
                    ['accept', '*/*'],
                    ['accept-language', 'en-US,en;q=0.9'],
                    ['content-type', 'application/json'],
                    // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
                    ['origin', 'https://opensea.io'],
                    ['referer', 'https://opensea.io/'],
                    ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
                    ['sec-ch-ua-mobile', '?0'],
                    ['sec-ch-ua-platform', '"Windows"'],
                    ['sec-fetch-dest', 'empty'],
                    ['sec-fetch-mode', 'cors'],
                    ['sec-fetch-site', 'same-origin'],
                    ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
                    ['x-app-id', 'opensea-web'],
                    ['x-build-id', '83461fee2b6cc511212b9070690059b88fe36a25'],
                    ['x-signed-query', '46684cd9f8a0f1ee30ec3e296859d974646870011a7ec2c94735b21b6b15d818']

                ],
                "body": payload
            });
            console.log(res);
            assetData = JSON.parse(res.body).data.eventActivity.edges;
            break
        }
        catch (e) {

        }
        await sleep(1000);
    }



    // console.log(assetData);

    // const collectionStats = (await axios.get(`https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&limit=${LimitNumber}&event_type=successful`, options)).data;
    // // const nextParam = collectionStats['next'];

    // const assetData = collectionStats["asset_events"];

    const salesData = {};
    var key = "Listing";
    salesData[key] = [];
    // let result = [];
    // try {
    //     result = (await axios.get(`https://platinumtools.s3.ap-southeast-1.amazonaws.com/os-${slug}.json`)).data;
    //     console.log(result)


    //     //check result data and call queue gather
    //     if (result.includes(`<Code>AccessDenied</Code>`)) {
    //         try {
    //             axios.get(`https://qprbaee7t7.execute-api.us-east-1.amazonaws.com/Prod/api/oscollectionrefreshC?collection=${slug}`)
    //         } catch { }
    //     }



    // }
    // catch (e) {

    // }

    var result = []

    try {
        result = (await axios.get(`https://platinumtools.s3.ap-southeast-1.amazonaws.com/os-${slug}.json`)).data;

        //check result data and call queue gather
        if (result === null || result == []) {
            try {
                axios.get(`https://qprbaee7t7.execute-api.us-east-1.amazonaws.com/Prod/api/oscollectionrefreshC?collection=${slug}`)
            } catch { }
        }
    } catch { }
    // const result = (await axios.get(`https://platinumtools.s3.ap-southeast-1.amazonaws.com/os-${slug}.json`)).data;
    let supply;
    while (true) {
        try {
            supply = await getSupply(contractAddress);
            break;
        }
        catch (e) {

        }
        await sleep(1000);
    }


    assetData.forEach(item => {
        if (salesData[key].length < 8) {

            if (item.node['eventTimestamp'] != null) {
                try {
                    // console.log(item);

                    const record = {};
                    let obj = result.find(o => o.t === item.node.item.tokenId);
                    record.type = "Nan"
                    if (obj != undefined) {
                        record.rarity = parseInt(obj.r);
                        let p = (record.rarity / supply) * 100;
                        if (p < 2)
                            record.type = "Legendary";
                        else if (p < 8)
                            record.type = "Epic";
                        else if (p < 15)
                            record.type = "Rare";
                        else if (p < 25)
                            record.type = "Uncommon";
                        else
                            record.type = "Common";
                    }
                    record['link'] = `https://opensea.io/assets/ethereum//${contractAddress}/${item.node['item']['tokenId']}`

                    record['id'] = item.node['item']['tokenId'];
                    record['name'] = item.node['item']['displayName'];
                    record['image_url'] = item.node.item.displayImageUrl;

                    // if (item['payment_token'] !== null)
                    //     record['market_image_url'] = item['payment_token']['image_url'];
                    // else
                    //     record['market_image_url'] = '';
                    record['market_image_url'] = item.node.item.displayImageUrl;
                    record['listing_date'] = item.node['eventTimestamp'].replace(/T/, ' ').replace(/\..+/, '');
                    record['listing_price'] = item.node.perUnitPrice['eth'] + " ETH";

                    // if (item['asset']['name'].indexOf('#') > 0)
                    //     record['rarity'] = Number(item['asset']['name'].split('#')[1]);
                    // else
                    //     record['rarity'] = 0;
                    // record['rarity'] = 0;
                    record['buy_rank'] = "Nan";

                    // Math.floor(record['rarity'] / 10) + 25;
                    salesData[key].push(record);
                }
                catch (e) {

                }
            }
        }
    });
    // console.log(salesData[key]);
    return salesData;
    // const collectionStats = await getAllEvents({ contract_address: contractAddress, total_limit: 1000 });


    // const assetData = collectionStats;

    // const salesData = {};
    // var key = "Listing";
    // salesData[key] = [];

    // assetData.forEach(item => {

    //     if (item['listing_time'] != null) {
    //         // console.log(item);
    //         const record = {};
    //         record['id'] = item['asset']['id'];
    //         record['name'] = item['asset']['name'];
    //         record['image_url'] = item['asset']['image_url'];

    //         if (item['payment_token'] !== null)
    //             record['market_image_url'] = item['payment_token']['image_url'];
    //         else
    //             record['market_image_url'] = '';

    //         record['listing_date'] = item['event_timestamp'].replace(/T/, ' ').replace(/\..+/, '');
    //         record['listing_price'] = item['starting_price'] / (10 ** 18) + " ETH";

    //         if (item['asset']['name'].indexOf('#') > 0)
    //             record['rarity'] = Number(item['asset']['name'].split('#')[1]);
    //         else
    //             record['rarity'] = 0;
    //         record['buy_rank'] = Math.floor(record['rarity'] / 10) + 25;
    //         salesData[key].push(record);
    //     }

    // });
    // // console.log(salesData[key]);
    // return salesData;
}
function dateDiffInDays(a, b) {
    // Discard the time and time-zone information.
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate(), a.getHours());
    const utc2 = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate(), b.getUTCHours());

    return (utc2 - utc1) / (60 * 60 * 1000);
}


const getListed = async (contractAddress, time = "Nan") => {
    const slug = (await getCollectionSlug(contractAddress)).slug;
    this.client = new Client();
    var res;
    let cursor = null;
    let record = [];
    let record_upcoming = true;
    let last_3_days_record = [];
    let record_upcoming_3_days = true;

    var randomNumber = Math.floor(Math.random() * presetArray.length);


    await this.client.init({
        type: "preset",
        preset: presetArray[randomNumber].preset,
    });
    //this.client = new Client();
    // await this.client.init({
    //     type: "preset",
    //     preset: "chrome84",
    // });
    let payload = JSON.stringify({
        "id": "AssetSearchCollectionQuery",
        "query": "query AssetSearchCollectionQuery(\n  $collection: CollectionSlug\n  $collections: [CollectionSlug!]\n  $count: Int\n  $cursor: String\n  $numericTraits: [TraitRangeType!]\n  $paymentAssets: [PaymentAssetSymbol!]\n  $priceFilter: PriceFilterType\n  $query: String\n  $resultModel: SearchResultModel\n  $showContextMenu: Boolean = false\n  $sortAscending: Boolean\n  $sortBy: SearchSortBy\n  $stringTraits: [TraitInputType!]\n  $toggles: [SearchToggle!]\n  $isAutoHidden: Boolean\n  $safelistRequestStatuses: [SafelistRequestStatus!]\n  $prioritizeBuyNow: Boolean = false\n  $rarityFilter: RarityFilterType\n) {\n  ...AssetSearchCollection_data_11pQ3o\n}\n\nfragment AssetAddToCartButton_order on OrderV2Type {\n  maker {\n    address\n    id\n  }\n  item {\n    __typename\n    ...itemEvents_data\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  ...ShoppingCartContextProvider_inline_order\n}\n\nfragment AssetCardBuyNow_data on AssetType {\n  tokenId\n  relayId\n  assetContract {\n    address\n    chain\n    id\n  }\n  orderData {\n    bestAskV2 {\n      relayId\n      priceType {\n        usd\n      }\n      id\n    }\n  }\n}\n\nfragment AssetContextMenu_data on AssetType {\n  ...asset_edit_url\n  ...asset_url\n  ...itemEvents_data\n  relayId\n  isDelisted\n  creator {\n    address\n    id\n  }\n  imageUrl\n}\n\nfragment AssetMediaAnimation_asset on AssetType {\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaAudio_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaContainer_asset_2V84VL on AssetType {\n  backgroundColor\n  ...AssetMediaEditions_asset_2V84VL\n}\n\nfragment AssetMediaEditions_asset_2V84VL on AssetType {\n  decimals\n}\n\nfragment AssetMediaImage_asset on AssetType {\n  backgroundColor\n  imageUrl\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaPlaceholderImage_asset on AssetType {\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaVideo_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaWebgl_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMedia_asset on AssetType {\n  animationUrl\n  displayImageUrl\n  imageUrl\n  isDelisted\n  ...AssetMediaAnimation_asset\n  ...AssetMediaAudio_asset\n  ...AssetMediaContainer_asset_2V84VL\n  ...AssetMediaImage_asset\n  ...AssetMediaPlaceholderImage_asset\n  ...AssetMediaVideo_asset\n  ...AssetMediaWebgl_asset\n}\n\nfragment AssetMedia_asset_2V84VL on AssetType {\n  animationUrl\n  displayImageUrl\n  imageUrl\n  isDelisted\n  ...AssetMediaAnimation_asset\n  ...AssetMediaAudio_asset\n  ...AssetMediaContainer_asset_2V84VL\n  ...AssetMediaImage_asset\n  ...AssetMediaPlaceholderImage_asset\n  ...AssetMediaVideo_asset\n  ...AssetMediaWebgl_asset\n}\n\nfragment AssetQuantity_data on AssetQuantityType {\n  asset {\n    ...Price_data\n    id\n  }\n  quantity\n}\n\nfragment AssetSearchCollection_data_11pQ3o on Query {\n  queriedAt\n  ...AssetSearchFilter_data_3KTzFc\n  ...PhoenixSearchPills_data_2Kg4Sq\n  search: collectionItems(after: $cursor, collections: $collections, first: $count, isAutoHidden: $isAutoHidden, numericTraits: $numericTraits, paymentAssets: $paymentAssets, resultType: $resultModel, priceFilter: $priceFilter, querystring: $query, safelistRequestStatuses: $safelistRequestStatuses, sortAscending: $sortAscending, sortBy: $sortBy, stringTraits: $stringTraits, toggles: $toggles, prioritizeBuyNow: $prioritizeBuyNow, rarityFilter: $rarityFilter) {\n    edges {\n      node {\n        __typename\n        relayId\n        ...AssetSearchList_data_27d9G3\n        ... on Node {\n          __isNode: __typename\n          id\n        }\n      }\n      cursor\n    }\n    totalCount\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment AssetSearchFilter_data_3KTzFc on Query {\n  collection(collection: $collection) {\n    numericTraits {\n      key\n      value {\n        max\n        min\n      }\n      ...NumericTraitFilter_data\n    }\n    stringTraits {\n      key\n      ...StringTraitFilter_data\n    }\n    defaultChain {\n      identifier\n    }\n    enabledRarities\n    ...RarityFilter_data\n    ...useIsRarityEnabled_collection\n    id\n  }\n  ...PaymentFilter_data_2YoIWt\n}\n\nfragment AssetSearchList_data_27d9G3 on ItemType {\n  __isItemType: __typename\n  __typename\n  relayId\n  ...ItemCard_data_1OrK6u\n  ... on AssetType {\n    collection {\n      isVerified\n      relayId\n      id\n    }\n    ...asset_url\n  }\n  ... on AssetBundleType {\n    bundleCollection: collection {\n      isVerified\n      relayId\n      id\n    }\n  }\n  chain {\n    identifier\n  }\n}\n\nfragment CollectionLink_assetContract on AssetContractType {\n  address\n  blockExplorerLink\n}\n\nfragment CollectionLink_collection on CollectionType {\n  name\n  slug\n  verificationStatus\n  ...collection_url\n}\n\nfragment ItemCardAnnotations_27d9G3 on ItemType {\n  __isItemType: __typename\n  relayId\n  __typename\n  ... on AssetType {\n    chain {\n      identifier\n    }\n    decimals\n    favoritesCount\n    isDelisted\n    isFrozen\n    hasUnlockableContent\n    ...AssetCardBuyNow_data\n    orderData {\n      bestAskV2 {\n        ...AssetAddToCartButton_order\n        orderType\n        maker {\n          address\n          id\n        }\n        id\n      }\n    }\n    ...AssetContextMenu_data @include(if: $showContextMenu)\n  }\n  ... on AssetBundleType {\n    assetCount\n  }\n}\n\nfragment ItemCardContent_2V84VL on ItemType {\n  __isItemType: __typename\n  __typename\n  ... on AssetType {\n    relayId\n    name\n    ...AssetMedia_asset_2V84VL\n  }\n  ... on AssetBundleType {\n    assetQuantities(first: 18) {\n      edges {\n        node {\n          asset {\n            relayId\n            ...AssetMedia_asset\n            id\n          }\n          id\n        }\n      }\n    }\n  }\n}\n\nfragment ItemCardFooter_27d9G3 on ItemType {\n  __isItemType: __typename\n  name\n  orderData {\n    bestBidV2 {\n      orderType\n      priceType {\n        unit\n      }\n      ...PriceContainer_data\n      id\n    }\n    bestAskV2 {\n      orderType\n      priceType {\n        unit\n      }\n      maker {\n        address\n        id\n      }\n      ...PriceContainer_data\n      id\n    }\n  }\n  ...ItemMetadata\n  ...ItemCardAnnotations_27d9G3\n  ... on AssetType {\n    tokenId\n    isDelisted\n    defaultRarityData {\n      ...RarityIndicator_data\n      id\n    }\n    collection {\n      slug\n      name\n      isVerified\n      ...collection_url\n      ...useIsRarityEnabled_collection\n      id\n    }\n  }\n  ... on AssetBundleType {\n    bundleCollection: collection {\n      slug\n      name\n      isVerified\n      ...collection_url\n      ...useIsRarityEnabled_collection\n      id\n    }\n  }\n}\n\nfragment ItemCard_data_1OrK6u on ItemType {\n  __isItemType: __typename\n  __typename\n  relayId\n  orderData {\n    bestAskV2 {\n      priceType {\n        eth\n      }\n      id\n    }\n  }\n  ...ItemCardContent_2V84VL\n  ...ItemCardFooter_27d9G3\n  ...item_url\n  ... on AssetType {\n    isDelisted\n    ...itemEvents_data\n  }\n}\n\nfragment ItemMetadata on ItemType {\n  __isItemType: __typename\n  __typename\n  orderData {\n    bestAskV2 {\n      closedAt\n      id\n    }\n  }\n  assetEventData {\n    lastSale {\n      unitPriceQuantity {\n        ...AssetQuantity_data\n        id\n      }\n    }\n  }\n}\n\nfragment NumericTraitFilter_data on NumericTraitTypePair {\n  key\n  value {\n    max\n    min\n  }\n}\n\nfragment OrderListItem_order on OrderV2Type {\n  relayId\n  item {\n    __typename\n    ... on AssetType {\n      __typename\n      displayName\n      assetContract {\n        ...CollectionLink_assetContract\n        id\n      }\n      collection {\n        ...CollectionLink_collection\n        id\n      }\n      ...AssetMedia_asset\n      ...asset_url\n      ...useAssetFees_asset\n    }\n    ... on AssetBundleType {\n      __typename\n    }\n    ...itemEvents_data\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  remainingQuantityType\n  ...OrderPrice\n}\n\nfragment OrderList_orders on OrderV2Type {\n  item {\n    __typename\n    relayId\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  relayId\n  ...OrderListItem_order\n}\n\nfragment OrderPrice on OrderV2Type {\n  priceType {\n    unit\n  }\n  perUnitPriceType {\n    unit\n  }\n  dutchAuctionFinalPriceType {\n    unit\n  }\n  openedAt\n  closedAt\n  payment {\n    ...TokenPricePayment\n    id\n  }\n}\n\nfragment PaymentFilter_data_2YoIWt on Query {\n  paymentAssets(first: 10) {\n    edges {\n      node {\n        symbol\n        id\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n  PaymentFilter_collection: collection(collection: $collection) {\n    paymentAssets {\n      symbol\n      id\n    }\n    id\n  }\n}\n\nfragment PhoenixSearchPills_data_2Kg4Sq on Query {\n  selectedCollections: collections(first: 25, collections: $collections, includeHidden: true) {\n    edges {\n      node {\n        imageUrl\n        name\n        slug\n        id\n      }\n    }\n  }\n}\n\nfragment PriceContainer_data on OrderV2Type {\n  ...OrderPrice\n}\n\nfragment Price_data on AssetType {\n  decimals\n  imageUrl\n  symbol\n  usdSpotPrice\n  assetContract {\n    blockExplorerLink\n    chain\n    id\n  }\n}\n\nfragment RarityFilter_data on CollectionType {\n  representativeRarityData {\n    maxRank\n    id\n  }\n}\n\nfragment RarityIndicator_data on RarityDataType {\n  rank\n  rankPercentile\n  rankCount\n  maxRank\n}\n\nfragment ShoppingCartContextProvider_inline_order on OrderV2Type {\n  relayId\n  item {\n    __typename\n    chain {\n      identifier\n    }\n    relayId\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  payment {\n    relayId\n    id\n  }\n  remainingQuantityType\n  ...ShoppingCart_orders\n}\n\nfragment ShoppingCartDetailedView_orders on OrderV2Type {\n  relayId\n  item {\n    __typename\n    chain {\n      identifier\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  supportsGiftingOnPurchase\n  ...useTotalPrice_orders\n  ...OrderList_orders\n}\n\nfragment ShoppingCartFooter_orders on OrderV2Type {\n  ...useTotalPrice_orders\n}\n\nfragment ShoppingCart_orders on OrderV2Type {\n  relayId\n  item {\n    __typename\n    relayId\n    chain {\n      identifier\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  payment {\n    relayId\n    symbol\n    id\n  }\n  ...ShoppingCartDetailedView_orders\n  ...ShoppingCartFooter_orders\n  ...useTotalPrice_orders\n}\n\nfragment StringTraitFilter_data on StringTraitType {\n  counts {\n    count\n    value\n  }\n  key\n}\n\nfragment TokenPricePayment on PaymentAssetType {\n  symbol\n  chain {\n    identifier\n  }\n  asset {\n    imageUrl\n    assetContract {\n      blockExplorerLink\n      id\n    }\n    id\n  }\n}\n\nfragment asset_edit_url on AssetType {\n  assetContract {\n    address\n    chain\n    id\n  }\n  tokenId\n  collection {\n    slug\n    id\n  }\n}\n\nfragment asset_url on AssetType {\n  assetContract {\n    address\n    id\n  }\n  tokenId\n  chain {\n    identifier\n  }\n}\n\nfragment bundle_url on AssetBundleType {\n  slug\n  chain {\n    identifier\n  }\n}\n\nfragment collection_url on CollectionType {\n  slug\n  isCategory\n}\n\nfragment itemEvents_data on AssetType {\n  relayId\n  assetContract {\n    address\n    id\n  }\n  tokenId\n  chain {\n    identifier\n  }\n}\n\nfragment item_url on ItemType {\n  __isItemType: __typename\n  __typename\n  ... on AssetType {\n    ...asset_url\n  }\n  ... on AssetBundleType {\n    ...bundle_url\n  }\n}\n\nfragment useAssetFees_asset on AssetType {\n  openseaSellerFeeBasisPoints\n  totalCreatorFee\n}\n\nfragment useIsRarityEnabled_collection on CollectionType {\n  slug\n  enabledRarities\n  isEligibleForRarity\n}\n\nfragment useTotalPrice_orders on OrderV2Type {\n  relayId\n  perUnitPriceType {\n    usd\n    unit\n  }\n  dutchAuctionFinalPriceType {\n    usd\n    unit\n  }\n  openedAt\n  closedAt\n  payment {\n    symbol\n    ...TokenPricePayment\n    id\n  }\n}\n",
        "variables": {


            "categories": null,
            "chains": ["ETHEREUM"],
            "collection": `${slug}`,
            "collectionQuery": null,
            "collectionSortBy": null,
            "collections": [
                `${slug}`
            ],
            "count": 32,
            "cursor": cursor,
            "includeHiddenCollections": null,
            "numericTraits": null,
            "paymentAssets": null,
            "priceFilter": null,
            "query": "",
            "resultModel": "ASSETS",
            "showContextMenu": true,
            "sortAscending": false,
            "sortBy": "LISTING_DATE",
            "stringTraits": null,
            "toggles": [
                "BUY_NOW"
            ],
            "creator": null,
            "assetOwner": null,
            "isPrivate": null,
            "isAutoHidden": null,
            "safelistRequestStatuses": null,
            "prioritizeBuyNow": true,
            "rarityFilter": null
        }
    })
    res = await this.client.request({
        url: `https://opensea.io/__api/graphql/`,
        method: "POST",
        headers: [
            ['authority', 'opensea.io'],
            ['accept', '*/*'],
            ['accept-language', 'en-US,en;q=0.9'],
            ['content-type', 'application/json'],
            // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
            ['origin', 'https://opensea.io'],
            ['referer', 'https://opensea.io/'],
            ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
            ['sec-ch-ua-mobile', '?0'],
            ['sec-ch-ua-platform', '"Windows"'],
            ['sec-fetch-dest', 'empty'],
            ['sec-fetch-mode', 'cors'],
            ['sec-fetch-site', 'same-origin'],


            ['user-agent', presetArray[randomNumber].ua],
            // ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
            ['x-app-id', 'opensea-web'],
            ['x-build-id', 'af2a3f21c162f8953f49c49349206b52e4b71667'],
            ['x-signed-query', 'f38da9a94905660d40c749b10dadde5ea0fda60ba0927a8665d354ef7e6f9fe8']

        ],
        // headers: [
        //     ['authority', 'opensea.io'],
        //     ['accept', '*/*'],
        //     ['accept-language', 'en-US,en;q=0.9'],
        //     ['content-type', 'application/json'],
        //     // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
        //     ['origin', 'https://opensea.io'],
        //     ['referer', 'https://opensea.io/'],
        //     ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
        //     ['sec-ch-ua-mobile', '?0'],
        //     ['sec-ch-ua-platform', '"Windows"'],
        //     ['sec-fetch-dest', 'empty'],
        //     ['sec-fetch-mode', 'cors'],
        //     ['sec-fetch-site', 'same-origin'],
        //     ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
        //     ['x-app-id', 'opensea-web'],
        //     ['x-build-id', 'af2a3f21c162f8953f49c49349206b52e4b71667'],
        //     ['x-signed-query', 'dc212a3e42833aa98a090bf576bd8966928927b5b746082ad1c1eb96933f6e9a']

        // ],

        "body": payload
    });
    let data = JSON.parse(res.body).data;
    let total_count = data.search.totalCount;
    record = record.concat(data.search.edges);
    let limit = 1000;
    let all_promise = [];
    for (let i = 31; i < total_count; i = i + 31) {

        //try to manage the start delays to see if this helps with the 403
        if ((i > 980 && i < 1000) || (i > 1980 && i < 2000)) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        cursor = btoa(`arrayconnection:${i}`)
        console.log(`arrayconnection:${i}`);
        payload = JSON.stringify({
            "id": "AssetSearchCollectionQuery",
            "query": "query AssetSearchCollectionQuery(\n  $collection: CollectionSlug\n  $collections: [CollectionSlug!]\n  $count: Int\n  $cursor: String\n  $numericTraits: [TraitRangeType!]\n  $paymentAssets: [PaymentAssetSymbol!]\n  $priceFilter: PriceFilterType\n  $query: String\n  $resultModel: SearchResultModel\n  $showContextMenu: Boolean = false\n  $sortAscending: Boolean\n  $sortBy: SearchSortBy\n  $stringTraits: [TraitInputType!]\n  $toggles: [SearchToggle!]\n  $isAutoHidden: Boolean\n  $safelistRequestStatuses: [SafelistRequestStatus!]\n  $prioritizeBuyNow: Boolean = false\n  $rarityFilter: RarityFilterType\n) {\n  ...AssetSearchCollection_data_11pQ3o\n}\n\nfragment AssetAddToCartButton_order on OrderV2Type {\n  maker {\n    address\n    id\n  }\n  item {\n    __typename\n    ...itemEvents_data\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  ...ShoppingCartContextProvider_inline_order\n}\n\nfragment AssetCardBuyNow_data on AssetType {\n  tokenId\n  relayId\n  assetContract {\n    address\n    chain\n    id\n  }\n  orderData {\n    bestAskV2 {\n      relayId\n      priceType {\n        usd\n      }\n      id\n    }\n  }\n}\n\nfragment AssetContextMenu_data on AssetType {\n  ...asset_edit_url\n  ...asset_url\n  ...itemEvents_data\n  relayId\n  isDelisted\n  creator {\n    address\n    id\n  }\n  imageUrl\n}\n\nfragment AssetMediaAnimation_asset on AssetType {\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaAudio_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaContainer_asset_2V84VL on AssetType {\n  backgroundColor\n  ...AssetMediaEditions_asset_2V84VL\n}\n\nfragment AssetMediaEditions_asset_2V84VL on AssetType {\n  decimals\n}\n\nfragment AssetMediaImage_asset on AssetType {\n  backgroundColor\n  imageUrl\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaPlaceholderImage_asset on AssetType {\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaVideo_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaWebgl_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMedia_asset on AssetType {\n  animationUrl\n  displayImageUrl\n  imageUrl\n  isDelisted\n  ...AssetMediaAnimation_asset\n  ...AssetMediaAudio_asset\n  ...AssetMediaContainer_asset_2V84VL\n  ...AssetMediaImage_asset\n  ...AssetMediaPlaceholderImage_asset\n  ...AssetMediaVideo_asset\n  ...AssetMediaWebgl_asset\n}\n\nfragment AssetMedia_asset_2V84VL on AssetType {\n  animationUrl\n  displayImageUrl\n  imageUrl\n  isDelisted\n  ...AssetMediaAnimation_asset\n  ...AssetMediaAudio_asset\n  ...AssetMediaContainer_asset_2V84VL\n  ...AssetMediaImage_asset\n  ...AssetMediaPlaceholderImage_asset\n  ...AssetMediaVideo_asset\n  ...AssetMediaWebgl_asset\n}\n\nfragment AssetQuantity_data on AssetQuantityType {\n  asset {\n    ...Price_data\n    id\n  }\n  quantity\n}\n\nfragment AssetSearchCollection_data_11pQ3o on Query {\n  queriedAt\n  ...AssetSearchFilter_data_3KTzFc\n  ...PhoenixSearchPills_data_2Kg4Sq\n  search: collectionItems(after: $cursor, collections: $collections, first: $count, isAutoHidden: $isAutoHidden, numericTraits: $numericTraits, paymentAssets: $paymentAssets, resultType: $resultModel, priceFilter: $priceFilter, querystring: $query, safelistRequestStatuses: $safelistRequestStatuses, sortAscending: $sortAscending, sortBy: $sortBy, stringTraits: $stringTraits, toggles: $toggles, prioritizeBuyNow: $prioritizeBuyNow, rarityFilter: $rarityFilter) {\n    edges {\n      node {\n        __typename\n        relayId\n        ...AssetSearchList_data_27d9G3\n        ... on Node {\n          __isNode: __typename\n          id\n        }\n      }\n      cursor\n    }\n    totalCount\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment AssetSearchFilter_data_3KTzFc on Query {\n  collection(collection: $collection) {\n    numericTraits {\n      key\n      value {\n        max\n        min\n      }\n      ...NumericTraitFilter_data\n    }\n    stringTraits {\n      key\n      ...StringTraitFilter_data\n    }\n    defaultChain {\n      identifier\n    }\n    enabledRarities\n    ...RarityFilter_data\n    ...useIsRarityEnabled_collection\n    id\n  }\n  ...PaymentFilter_data_2YoIWt\n}\n\nfragment AssetSearchList_data_27d9G3 on ItemType {\n  __isItemType: __typename\n  __typename\n  relayId\n  ...ItemCard_data_1OrK6u\n  ... on AssetType {\n    collection {\n      isVerified\n      relayId\n      id\n    }\n    ...asset_url\n  }\n  ... on AssetBundleType {\n    bundleCollection: collection {\n      isVerified\n      relayId\n      id\n    }\n  }\n  chain {\n    identifier\n  }\n}\n\nfragment CollectionLink_assetContract on AssetContractType {\n  address\n  blockExplorerLink\n}\n\nfragment CollectionLink_collection on CollectionType {\n  name\n  slug\n  verificationStatus\n  ...collection_url\n}\n\nfragment ItemCardAnnotations_27d9G3 on ItemType {\n  __isItemType: __typename\n  relayId\n  __typename\n  ... on AssetType {\n    chain {\n      identifier\n    }\n    decimals\n    favoritesCount\n    isDelisted\n    isFrozen\n    hasUnlockableContent\n    ...AssetCardBuyNow_data\n    orderData {\n      bestAskV2 {\n        ...AssetAddToCartButton_order\n        orderType\n        maker {\n          address\n          id\n        }\n        id\n      }\n    }\n    ...AssetContextMenu_data @include(if: $showContextMenu)\n  }\n  ... on AssetBundleType {\n    assetCount\n  }\n}\n\nfragment ItemCardContent_2V84VL on ItemType {\n  __isItemType: __typename\n  __typename\n  ... on AssetType {\n    relayId\n    name\n    ...AssetMedia_asset_2V84VL\n  }\n  ... on AssetBundleType {\n    assetQuantities(first: 18) {\n      edges {\n        node {\n          asset {\n            relayId\n            ...AssetMedia_asset\n            id\n          }\n          id\n        }\n      }\n    }\n  }\n}\n\nfragment ItemCardFooter_27d9G3 on ItemType {\n  __isItemType: __typename\n  name\n  orderData {\n    bestBidV2 {\n      orderType\n      priceType {\n        unit\n      }\n      ...PriceContainer_data\n      id\n    }\n    bestAskV2 {\n      orderType\n      priceType {\n        unit\n      }\n      maker {\n        address\n        id\n      }\n      ...PriceContainer_data\n      id\n    }\n  }\n  ...ItemMetadata\n  ...ItemCardAnnotations_27d9G3\n  ... on AssetType {\n    tokenId\n    isDelisted\n    defaultRarityData {\n      ...RarityIndicator_data\n      id\n    }\n    collection {\n      slug\n      name\n      isVerified\n      ...collection_url\n      ...useIsRarityEnabled_collection\n      id\n    }\n  }\n  ... on AssetBundleType {\n    bundleCollection: collection {\n      slug\n      name\n      isVerified\n      ...collection_url\n      ...useIsRarityEnabled_collection\n      id\n    }\n  }\n}\n\nfragment ItemCard_data_1OrK6u on ItemType {\n  __isItemType: __typename\n  __typename\n  relayId\n  orderData {\n    bestAskV2 {\n      priceType {\n        eth\n      }\n      id\n    }\n  }\n  ...ItemCardContent_2V84VL\n  ...ItemCardFooter_27d9G3\n  ...item_url\n  ... on AssetType {\n    isDelisted\n    ...itemEvents_data\n  }\n}\n\nfragment ItemMetadata on ItemType {\n  __isItemType: __typename\n  __typename\n  orderData {\n    bestAskV2 {\n      closedAt\n      id\n    }\n  }\n  assetEventData {\n    lastSale {\n      unitPriceQuantity {\n        ...AssetQuantity_data\n        id\n      }\n    }\n  }\n}\n\nfragment NumericTraitFilter_data on NumericTraitTypePair {\n  key\n  value {\n    max\n    min\n  }\n}\n\nfragment OrderListItem_order on OrderV2Type {\n  relayId\n  item {\n    __typename\n    ... on AssetType {\n      __typename\n      displayName\n      assetContract {\n        ...CollectionLink_assetContract\n        id\n      }\n      collection {\n        ...CollectionLink_collection\n        id\n      }\n      ...AssetMedia_asset\n      ...asset_url\n      ...useAssetFees_asset\n    }\n    ... on AssetBundleType {\n      __typename\n    }\n    ...itemEvents_data\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  remainingQuantityType\n  ...OrderPrice\n}\n\nfragment OrderList_orders on OrderV2Type {\n  item {\n    __typename\n    relayId\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  relayId\n  ...OrderListItem_order\n}\n\nfragment OrderPrice on OrderV2Type {\n  priceType {\n    unit\n  }\n  perUnitPriceType {\n    unit\n  }\n  dutchAuctionFinalPriceType {\n    unit\n  }\n  openedAt\n  closedAt\n  payment {\n    ...TokenPricePayment\n    id\n  }\n}\n\nfragment PaymentFilter_data_2YoIWt on Query {\n  paymentAssets(first: 10) {\n    edges {\n      node {\n        symbol\n        id\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n  PaymentFilter_collection: collection(collection: $collection) {\n    paymentAssets {\n      symbol\n      id\n    }\n    id\n  }\n}\n\nfragment PhoenixSearchPills_data_2Kg4Sq on Query {\n  selectedCollections: collections(first: 25, collections: $collections, includeHidden: true) {\n    edges {\n      node {\n        imageUrl\n        name\n        slug\n        id\n      }\n    }\n  }\n}\n\nfragment PriceContainer_data on OrderV2Type {\n  ...OrderPrice\n}\n\nfragment Price_data on AssetType {\n  decimals\n  imageUrl\n  symbol\n  usdSpotPrice\n  assetContract {\n    blockExplorerLink\n    chain\n    id\n  }\n}\n\nfragment RarityFilter_data on CollectionType {\n  representativeRarityData {\n    maxRank\n    id\n  }\n}\n\nfragment RarityIndicator_data on RarityDataType {\n  rank\n  rankPercentile\n  rankCount\n  maxRank\n}\n\nfragment ShoppingCartContextProvider_inline_order on OrderV2Type {\n  relayId\n  item {\n    __typename\n    chain {\n      identifier\n    }\n    relayId\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  payment {\n    relayId\n    id\n  }\n  remainingQuantityType\n  ...ShoppingCart_orders\n}\n\nfragment ShoppingCartDetailedView_orders on OrderV2Type {\n  relayId\n  item {\n    __typename\n    chain {\n      identifier\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  supportsGiftingOnPurchase\n  ...useTotalPrice_orders\n  ...OrderList_orders\n}\n\nfragment ShoppingCartFooter_orders on OrderV2Type {\n  ...useTotalPrice_orders\n}\n\nfragment ShoppingCart_orders on OrderV2Type {\n  relayId\n  item {\n    __typename\n    relayId\n    chain {\n      identifier\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  payment {\n    relayId\n    symbol\n    id\n  }\n  ...ShoppingCartDetailedView_orders\n  ...ShoppingCartFooter_orders\n  ...useTotalPrice_orders\n}\n\nfragment StringTraitFilter_data on StringTraitType {\n  counts {\n    count\n    value\n  }\n  key\n}\n\nfragment TokenPricePayment on PaymentAssetType {\n  symbol\n  chain {\n    identifier\n  }\n  asset {\n    imageUrl\n    assetContract {\n      blockExplorerLink\n      id\n    }\n    id\n  }\n}\n\nfragment asset_edit_url on AssetType {\n  assetContract {\n    address\n    chain\n    id\n  }\n  tokenId\n  collection {\n    slug\n    id\n  }\n}\n\nfragment asset_url on AssetType {\n  assetContract {\n    address\n    id\n  }\n  tokenId\n  chain {\n    identifier\n  }\n}\n\nfragment bundle_url on AssetBundleType {\n  slug\n  chain {\n    identifier\n  }\n}\n\nfragment collection_url on CollectionType {\n  slug\n  isCategory\n}\n\nfragment itemEvents_data on AssetType {\n  relayId\n  assetContract {\n    address\n    id\n  }\n  tokenId\n  chain {\n    identifier\n  }\n}\n\nfragment item_url on ItemType {\n  __isItemType: __typename\n  __typename\n  ... on AssetType {\n    ...asset_url\n  }\n  ... on AssetBundleType {\n    ...bundle_url\n  }\n}\n\nfragment useAssetFees_asset on AssetType {\n  openseaSellerFeeBasisPoints\n  totalCreatorFee\n}\n\nfragment useIsRarityEnabled_collection on CollectionType {\n  slug\n  enabledRarities\n  isEligibleForRarity\n}\n\nfragment useTotalPrice_orders on OrderV2Type {\n  relayId\n  perUnitPriceType {\n    usd\n    unit\n  }\n  dutchAuctionFinalPriceType {\n    usd\n    unit\n  }\n  openedAt\n  closedAt\n  payment {\n    symbol\n    ...TokenPricePayment\n    id\n  }\n}\n",
            "variables": {
                "categories": null,
                "chains": null,
                "collection": `${slug}`,
                "collectionQuery": null,
                "collectionSortBy": null,
                "collections": [
                    `${slug}`
                ],
                "count": 32,
                "cursor": cursor,
                "includeHiddenCollections": null,

                "numericTraits": null,
                "paymentAssets": null,
                "priceFilter": null,
                "query": "",
                "resultModel": "ASSETS",
                "showContextMenu": true,
                "sortAscending": false,
                "sortBy": "LISTING_DATE",
                "stringTraits": null,
                "toggles": [
                    "BUY_NOW"
                ],
                "creator": null,
                "assetOwner": null,
                "isPrivate": null,
                "isAutoHidden": null,
                "safelistRequestStatuses": null,
                "prioritizeBuyNow": true,
                "rarityFilter": null
            }
        })
        let promise = getData(payload)
        all_promise.push(promise);
        // await delay(1000);

    }
    for (var item in all_promise) {
        // console.log(all_promise[item]);
        let result = await all_promise[item];

        // console.log(result);
        record = record.concat(result);
    }

    var result = []

    try {
        result = (await axios.get(`https://platinumtools.s3.ap-southeast-1.amazonaws.com/os-${slug}.json`)).data;

        //check result data and call queue gather
        if (result === null || result == []) {
            try {
                axios.get(`https://qprbaee7t7.execute-api.us-east-1.amazonaws.com/Prod/api/oscollectionrefreshC?collection=${slug}`)
            } catch { }
        }
    } catch (err) { console.log(err.message) }

    const supply = await getSupply(contractAddress);
    record.forEach(item => {
        let obj = result.find(o => o.t === item.node.tokenId);
        if (obj != undefined) {
            item.rarity = parseInt(obj.r);
            let p = (item.rarity / supply) * 100;
            if (p < 2)
                item.type = "Legendary";
            else if (p < 8)
                item.type = "Epic";
            else if (p < 15)
                item.type = "Rare";
            else if (p < 25)
                item.type = "Uncommon";
            else
                item.type = "Common";
        }

    })
    return record;

}


const getFilteredTokens = async (contractAddress, filters, page) => {

    // usedfilters = {
    //     priceFilter: {symbol: "ETH", max: 100, min: 0},
    //     traitFilter: [{name: "Earring", values: ["M1 Silver Hoop"]}, {name: "Fur", values: ["M1 Dark Brown"]}], 
    // }

    let usedfilters = {
        priceFilter: null,
        traitFilter: null, 
    }

    try{
        usedfilters.priceFilter = filters.priceFilter,
        usedfilters.traitFilter = filters.traitFilter
    }catch{}
    
    
    const slug = (await getCollectionSlug(contractAddress)).slug;
    this.client = new Client();
    var res;
    let cursor = null;
    let record = [];
    // let record_upcoming = true;
    // let last_3_days_record = [];
    // let record_upcoming_3_days = true;

    
    if (page == 2){
        cursor = btoa(`arrayconnection:31`)
    }

    if (page > 2){

        var cursorCount = 31+(32*(page-1))
        cursor = btoa(`arrayconnection:${cursorCount}`)
    }

    var randomNumber = Math.floor(Math.random() * presetArray.length);


    await this.client.init({
        type: "preset",
        preset: presetArray[randomNumber].preset,
    });
    //this.client = new Client();
    // await this.client.init({
    //     type: "preset",
    //     preset: "chrome84",
    // });
    let payload = JSON.stringify({
        "id": "AssetSearchCollectionQuery",
        "query": "query AssetSearchCollectionQuery(\n  $collection: CollectionSlug\n  $collections: [CollectionSlug!]\n  $count: Int\n  $cursor: String\n  $numericTraits: [TraitRangeType!]\n  $paymentAssets: [PaymentAssetSymbol!]\n  $priceFilter: PriceFilterType\n  $query: String\n  $resultModel: SearchResultModel\n  $showContextMenu: Boolean = false\n  $sortAscending: Boolean\n  $sortBy: SearchSortBy\n  $stringTraits: [TraitInputType!]\n  $toggles: [SearchToggle!]\n  $isAutoHidden: Boolean\n  $safelistRequestStatuses: [SafelistRequestStatus!]\n  $prioritizeBuyNow: Boolean = false\n  $rarityFilter: RarityFilterType\n) {\n  ...AssetSearchCollection_data_11pQ3o\n}\n\nfragment AssetAddToCartButton_order on OrderV2Type {\n  maker {\n    address\n    id\n  }\n  item {\n    __typename\n    ...itemEvents_data\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  ...ShoppingCartContextProvider_inline_order\n}\n\nfragment AssetCardBuyNow_data on AssetType {\n  tokenId\n  relayId\n  assetContract {\n    address\n    chain\n    id\n  }\n  orderData {\n    bestAskV2 {\n      relayId\n      priceType {\n        usd\n      }\n      id\n    }\n  }\n}\n\nfragment AssetContextMenu_data on AssetType {\n  ...asset_edit_url\n  ...asset_url\n  ...itemEvents_data\n  relayId\n  isDelisted\n  creator {\n    address\n    id\n  }\n  imageUrl\n}\n\nfragment AssetMediaAnimation_asset on AssetType {\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaAudio_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaContainer_asset_2V84VL on AssetType {\n  backgroundColor\n  ...AssetMediaEditions_asset_2V84VL\n}\n\nfragment AssetMediaEditions_asset_2V84VL on AssetType {\n  decimals\n}\n\nfragment AssetMediaImage_asset on AssetType {\n  backgroundColor\n  imageUrl\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaPlaceholderImage_asset on AssetType {\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaVideo_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaWebgl_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMedia_asset on AssetType {\n  animationUrl\n  displayImageUrl\n  imageUrl\n  isDelisted\n  ...AssetMediaAnimation_asset\n  ...AssetMediaAudio_asset\n  ...AssetMediaContainer_asset_2V84VL\n  ...AssetMediaImage_asset\n  ...AssetMediaPlaceholderImage_asset\n  ...AssetMediaVideo_asset\n  ...AssetMediaWebgl_asset\n}\n\nfragment AssetMedia_asset_2V84VL on AssetType {\n  animationUrl\n  displayImageUrl\n  imageUrl\n  isDelisted\n  ...AssetMediaAnimation_asset\n  ...AssetMediaAudio_asset\n  ...AssetMediaContainer_asset_2V84VL\n  ...AssetMediaImage_asset\n  ...AssetMediaPlaceholderImage_asset\n  ...AssetMediaVideo_asset\n  ...AssetMediaWebgl_asset\n}\n\nfragment AssetQuantity_data on AssetQuantityType {\n  asset {\n    ...Price_data\n    id\n  }\n  quantity\n}\n\nfragment AssetSearchCollection_data_11pQ3o on Query {\n  queriedAt\n  ...AssetSearchFilter_data_3KTzFc\n  ...PhoenixSearchPills_data_2Kg4Sq\n  search: collectionItems(after: $cursor, collections: $collections, first: $count, isAutoHidden: $isAutoHidden, numericTraits: $numericTraits, paymentAssets: $paymentAssets, resultType: $resultModel, priceFilter: $priceFilter, querystring: $query, safelistRequestStatuses: $safelistRequestStatuses, sortAscending: $sortAscending, sortBy: $sortBy, stringTraits: $stringTraits, toggles: $toggles, prioritizeBuyNow: $prioritizeBuyNow, rarityFilter: $rarityFilter) {\n    edges {\n      node {\n        __typename\n        relayId\n        ...AssetSearchList_data_27d9G3\n        ... on Node {\n          __isNode: __typename\n          id\n        }\n      }\n      cursor\n    }\n    totalCount\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment AssetSearchFilter_data_3KTzFc on Query {\n  collection(collection: $collection) {\n    numericTraits {\n      key\n      value {\n        max\n        min\n      }\n      ...NumericTraitFilter_data\n    }\n    stringTraits {\n      key\n      ...StringTraitFilter_data\n    }\n    defaultChain {\n      identifier\n    }\n    enabledRarities\n    ...RarityFilter_data\n    ...useIsRarityEnabled_collection\n    id\n  }\n  ...PaymentFilter_data_2YoIWt\n}\n\nfragment AssetSearchList_data_27d9G3 on ItemType {\n  __isItemType: __typename\n  __typename\n  relayId\n  ...ItemCard_data_1OrK6u\n  ... on AssetType {\n    collection {\n      isVerified\n      relayId\n      id\n    }\n    ...asset_url\n  }\n  ... on AssetBundleType {\n    bundleCollection: collection {\n      isVerified\n      relayId\n      id\n    }\n  }\n  chain {\n    identifier\n  }\n}\n\nfragment CollectionLink_assetContract on AssetContractType {\n  address\n  blockExplorerLink\n}\n\nfragment CollectionLink_collection on CollectionType {\n  name\n  slug\n  verificationStatus\n  ...collection_url\n}\n\nfragment ItemCardAnnotations_27d9G3 on ItemType {\n  __isItemType: __typename\n  relayId\n  __typename\n  ... on AssetType {\n    chain {\n      identifier\n    }\n    decimals\n    favoritesCount\n    isDelisted\n    isFrozen\n    hasUnlockableContent\n    ...AssetCardBuyNow_data\n    orderData {\n      bestAskV2 {\n        ...AssetAddToCartButton_order\n        orderType\n        maker {\n          address\n          id\n        }\n        id\n      }\n    }\n    ...AssetContextMenu_data @include(if: $showContextMenu)\n  }\n  ... on AssetBundleType {\n    assetCount\n  }\n}\n\nfragment ItemCardContent_2V84VL on ItemType {\n  __isItemType: __typename\n  __typename\n  ... on AssetType {\n    relayId\n    name\n    ...AssetMedia_asset_2V84VL\n  }\n  ... on AssetBundleType {\n    assetQuantities(first: 18) {\n      edges {\n        node {\n          asset {\n            relayId\n            ...AssetMedia_asset\n            id\n          }\n          id\n        }\n      }\n    }\n  }\n}\n\nfragment ItemCardFooter_27d9G3 on ItemType {\n  __isItemType: __typename\n  name\n  orderData {\n    bestBidV2 {\n      orderType\n      priceType {\n        unit\n      }\n      ...PriceContainer_data\n      id\n    }\n    bestAskV2 {\n      orderType\n      priceType {\n        unit\n      }\n      maker {\n        address\n        id\n      }\n      ...PriceContainer_data\n      id\n    }\n  }\n  ...ItemMetadata\n  ...ItemCardAnnotations_27d9G3\n  ... on AssetType {\n    tokenId\n    isDelisted\n    defaultRarityData {\n      ...RarityIndicator_data\n      id\n    }\n    collection {\n      slug\n      name\n      isVerified\n      ...collection_url\n      ...useIsRarityEnabled_collection\n      id\n    }\n  }\n  ... on AssetBundleType {\n    bundleCollection: collection {\n      slug\n      name\n      isVerified\n      ...collection_url\n      ...useIsRarityEnabled_collection\n      id\n    }\n  }\n}\n\nfragment ItemCard_data_1OrK6u on ItemType {\n  __isItemType: __typename\n  __typename\n  relayId\n  orderData {\n    bestAskV2 {\n      priceType {\n        eth\n      }\n      id\n    }\n  }\n  ...ItemCardContent_2V84VL\n  ...ItemCardFooter_27d9G3\n  ...item_url\n  ... on AssetType {\n    isDelisted\n    ...itemEvents_data\n  }\n}\n\nfragment ItemMetadata on ItemType {\n  __isItemType: __typename\n  __typename\n  orderData {\n    bestAskV2 {\n      closedAt\n      id\n    }\n  }\n  assetEventData {\n    lastSale {\n      unitPriceQuantity {\n        ...AssetQuantity_data\n        id\n      }\n    }\n  }\n}\n\nfragment NumericTraitFilter_data on NumericTraitTypePair {\n  key\n  value {\n    max\n    min\n  }\n}\n\nfragment OrderListItem_order on OrderV2Type {\n  relayId\n  item {\n    __typename\n    ... on AssetType {\n      __typename\n      displayName\n      assetContract {\n        ...CollectionLink_assetContract\n        id\n      }\n      collection {\n        ...CollectionLink_collection\n        id\n      }\n      ...AssetMedia_asset\n      ...asset_url\n      ...useAssetFees_asset\n    }\n    ... on AssetBundleType {\n      __typename\n    }\n    ...itemEvents_data\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  remainingQuantityType\n  ...OrderPrice\n}\n\nfragment OrderList_orders on OrderV2Type {\n  item {\n    __typename\n    relayId\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  relayId\n  ...OrderListItem_order\n}\n\nfragment OrderPrice on OrderV2Type {\n  priceType {\n    unit\n  }\n  perUnitPriceType {\n    unit\n  }\n  dutchAuctionFinalPriceType {\n    unit\n  }\n  openedAt\n  closedAt\n  payment {\n    ...TokenPricePayment\n    id\n  }\n}\n\nfragment PaymentFilter_data_2YoIWt on Query {\n  paymentAssets(first: 10) {\n    edges {\n      node {\n        symbol\n        id\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n  PaymentFilter_collection: collection(collection: $collection) {\n    paymentAssets {\n      symbol\n      id\n    }\n    id\n  }\n}\n\nfragment PhoenixSearchPills_data_2Kg4Sq on Query {\n  selectedCollections: collections(first: 25, collections: $collections, includeHidden: true) {\n    edges {\n      node {\n        imageUrl\n        name\n        slug\n        id\n      }\n    }\n  }\n}\n\nfragment PriceContainer_data on OrderV2Type {\n  ...OrderPrice\n}\n\nfragment Price_data on AssetType {\n  decimals\n  imageUrl\n  symbol\n  usdSpotPrice\n  assetContract {\n    blockExplorerLink\n    chain\n    id\n  }\n}\n\nfragment RarityFilter_data on CollectionType {\n  representativeRarityData {\n    maxRank\n    id\n  }\n}\n\nfragment RarityIndicator_data on RarityDataType {\n  rank\n  rankPercentile\n  rankCount\n  maxRank\n}\n\nfragment ShoppingCartContextProvider_inline_order on OrderV2Type {\n  relayId\n  item {\n    __typename\n    chain {\n      identifier\n    }\n    relayId\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  payment {\n    relayId\n    id\n  }\n  remainingQuantityType\n  ...ShoppingCart_orders\n}\n\nfragment ShoppingCartDetailedView_orders on OrderV2Type {\n  relayId\n  item {\n    __typename\n    chain {\n      identifier\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  supportsGiftingOnPurchase\n  ...useTotalPrice_orders\n  ...OrderList_orders\n}\n\nfragment ShoppingCartFooter_orders on OrderV2Type {\n  ...useTotalPrice_orders\n}\n\nfragment ShoppingCart_orders on OrderV2Type {\n  relayId\n  item {\n    __typename\n    relayId\n    chain {\n      identifier\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  payment {\n    relayId\n    symbol\n    id\n  }\n  ...ShoppingCartDetailedView_orders\n  ...ShoppingCartFooter_orders\n  ...useTotalPrice_orders\n}\n\nfragment StringTraitFilter_data on StringTraitType {\n  counts {\n    count\n    value\n  }\n  key\n}\n\nfragment TokenPricePayment on PaymentAssetType {\n  symbol\n  chain {\n    identifier\n  }\n  asset {\n    imageUrl\n    assetContract {\n      blockExplorerLink\n      id\n    }\n    id\n  }\n}\n\nfragment asset_edit_url on AssetType {\n  assetContract {\n    address\n    chain\n    id\n  }\n  tokenId\n  collection {\n    slug\n    id\n  }\n}\n\nfragment asset_url on AssetType {\n  assetContract {\n    address\n    id\n  }\n  tokenId\n  chain {\n    identifier\n  }\n}\n\nfragment bundle_url on AssetBundleType {\n  slug\n  chain {\n    identifier\n  }\n}\n\nfragment collection_url on CollectionType {\n  slug\n  isCategory\n}\n\nfragment itemEvents_data on AssetType {\n  relayId\n  assetContract {\n    address\n    id\n  }\n  tokenId\n  chain {\n    identifier\n  }\n}\n\nfragment item_url on ItemType {\n  __isItemType: __typename\n  __typename\n  ... on AssetType {\n    ...asset_url\n  }\n  ... on AssetBundleType {\n    ...bundle_url\n  }\n}\n\nfragment useAssetFees_asset on AssetType {\n  openseaSellerFeeBasisPoints\n  totalCreatorFee\n}\n\nfragment useIsRarityEnabled_collection on CollectionType {\n  slug\n  enabledRarities\n  isEligibleForRarity\n}\n\nfragment useTotalPrice_orders on OrderV2Type {\n  relayId\n  perUnitPriceType {\n    usd\n    unit\n  }\n  dutchAuctionFinalPriceType {\n    usd\n    unit\n  }\n  openedAt\n  closedAt\n  payment {\n    symbol\n    ...TokenPricePayment\n    id\n  }\n}\n",
        "variables": {


            "categories": null,
            "chains": ["ETHEREUM"],
            "collection": `${slug}`,
            "collectionQuery": null,
            "collectionSortBy": null,
            "collections": [
                `${slug}`
            ],
            "count": 32,
            "cursor": cursor,
            "includeHiddenCollections": null,
            "numericTraits": null,
            "paymentAssets": null,
            "priceFilter": usedfilters.priceFilter,
            "query": "",
            "resultModel": "ASSETS",
            "showContextMenu": true,
            "sortAscending": false,
            "sortBy": "LISTING_DATE",
            "stringTraits": usedfilters.traitFilter,
            "toggles": [],
            "creator": null,
            "assetOwner": null,
            "isPrivate": null,
            "isAutoHidden": null,
            "safelistRequestStatuses": null,
            "prioritizeBuyNow": true,
            "rarityFilter": null
        }
    })
    res = await this.client.request({
        url: `https://opensea.io/__api/graphql/`,
        method: "POST",
        headers: [
            ['authority', 'opensea.io'],
            ['accept', '*/*'],
            ['accept-language', 'en-US,en;q=0.9'],
            ['content-type', 'application/json'],
            // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
            ['origin', 'https://opensea.io'],
            ['referer', 'https://opensea.io/'],
            ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
            ['sec-ch-ua-mobile', '?0'],
            ['sec-ch-ua-platform', '"Windows"'],
            ['sec-fetch-dest', 'empty'],
            ['sec-fetch-mode', 'cors'],
            ['sec-fetch-site', 'same-origin'],


            ['user-agent', presetArray[randomNumber].ua],
            // ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
            ['x-app-id', 'opensea-web'],
            ['x-build-id', 'af2a3f21c162f8953f49c49349206b52e4b71667'],
            ['x-signed-query', 'f38da9a94905660d40c749b10dadde5ea0fda60ba0927a8665d354ef7e6f9fe8']

        ],

        "body": payload
    });
    let data = JSON.parse(res.body).data;
    let total_count = data.search.totalCount;
    record = record.concat(data.search.edges);
    

    var result = []

    try {
        result = (await axios.get(`https://platinumtools.s3.ap-southeast-1.amazonaws.com/os-${slug}.json`)).data;

        //check result data and call queue gather
        if (result === null || result == []) {
            try {
                axios.get(`https://qprbaee7t7.execute-api.us-east-1.amazonaws.com/Prod/api/oscollectionrefreshC?collection=${slug}`)
            } catch { }
        }
    } catch (err) { console.log(err.message) }

    const supply = await getSupply(contractAddress);
    record.forEach(item => {
        let obj = result.find(o => o.t === item.node.tokenId);
        if (obj != undefined) {
            item.rarity = parseInt(obj.r);
            let p = (item.rarity / supply) * 100;
            if (p < 2)
                item.type = "Legendary";
            else if (p < 8)
                item.type = "Epic";
            else if (p < 15)
                item.type = "Rare";
            else if (p < 25)
                item.type = "Uncommon";
            else
                item.type = "Common";
        }

    })
    return record;

}



const getCollectionTraits = async (contractAddress) => {
    const slug = (await getCollectionSlug(contractAddress)).slug;
    this.client = new Client();
    var res;
    let cursor = null;
    let record = [];
    let record_upcoming = true;
    let last_3_days_record = [];
    let record_upcoming_3_days = true;

    var randomNumber = Math.floor(Math.random() * presetArray.length);


    await this.client.init({
        type: "preset",
        preset: presetArray[randomNumber].preset,
    });
    //this.client = new Client();
    // await this.client.init({
    //     type: "preset",
    //     preset: "chrome84",
    // });
    let payload = JSON.stringify({
        "id": "AssetSearchCollectionQuery",
        "query": "query TraitSelectorQuery(\n  $collectionSlug: CollectionSlug\n  $withTraitFloor: Boolean\n) {\n  collection(collection: $collectionSlug) {\n    ...TraitSelector_data_4zPn1c\n    id\n  }\n}\n\nfragment TraitSelector_data_4zPn1c on CollectionType {\n  statsV2 {\n    totalSupply\n  }\n  stringTraits(withTraitFloor: $withTraitFloor) {\n    key\n    counts {\n      count\n      value\n      floor {\n        eth\n        unit\n        symbol\n        usd\n      }\n    }\n  }\n}\n",

        "variables": {

            "collectionSlug": slug,
            "withTraitFloor": true

        }
    })
    res = await this.client.request({
        url: `https://opensea.io/__api/graphql/`,
        method: "POST",
        headers: [
            ['authority', 'opensea.io'],
            ['accept', '*/*'],
            ['accept-language', 'en-US,en;q=0.9'],
            ['content-type', 'application/json'],
            // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
            ['origin', 'https://opensea.io'],
            ['referer', 'https://opensea.io/'],
            ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
            ['sec-ch-ua-mobile', '?0'],
            ['sec-ch-ua-platform', '"Windows"'],
            ['sec-fetch-dest', 'empty'],
            ['sec-fetch-mode', 'cors'],
            ['sec-fetch-site', 'same-origin'],


            ['user-agent', presetArray[randomNumber].ua],

            ["x-app-id", "opensea-web"],
            ["x-build-id", "18f42b42441d67fa8378d9770ba25ebfeb44145d"],
            ["x-signed-query", "c0d9650c67a277c15f1810553e8461f813078059fab537dd04fb9abb1a10740e"]
            // ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
            // ['x-app-id', 'opensea-web'],
            // ['x-build-id', 'af2a3f21c162f8953f49c49349206b52e4b71667'],
            // ['x-signed-query', 'f38da9a94905660d40c749b10dadde5ea0fda60ba0927a8665d354ef7e6f9fe8']

        ],
        "body": payload
    });
    let data = JSON.parse(res.body).data;


    let FinalTraitRes = []

    try {
        let traitsRaw = data.collection.stringTraits;
        traitsRaw.forEach((mainKeyVal) => {
            mainKeyVal.counts.forEach(mainKeyValCounts => {
                FinalTraitRes.push({
                    key: mainKeyVal.key,
                    value: mainKeyValCounts.value,
                    count: mainKeyValCounts.count,
                    floor: mainKeyValCounts.floor
                })
            })
        })
    } catch (err) {
        return { "Error": `${err.message}` }
    }



    return FinalTraitRes;

}

const getListingHistory = async (contractAddress) => {
    const slug = (await getCollectionSlug(contractAddress)).slug;
    this.client = new Client();
    var res;
    let cursor = null;
    let record = [];
    let record_upcoming = true;
    let last_3_days_record = [];
    let record_upcoming_3_days = true;
    await this.client.init({
        type: "preset",
        preset: "chrome83",
    });
    this.client = new Client();
    await this.client.init({
        type: "preset",
        preset: "chrome83",
    });
    let payload = JSON.stringify({
        "id": "EventHistoryQuery",
        "query": "query EventHistoryQuery(\n  $archetype: ArchetypeInputType\n  $bundle: BundleSlug\n  $collections: [CollectionSlug!]\n  $categories: [CollectionSlug!]\n  $chains: [ChainScalar!]\n  $eventTypes: [EventType!]\n  $cursor: String\n  $count: Int = 16\n  $showAll: Boolean = false\n  $identity: IdentityInputType\n) {\n  ...EventHistory_data_L1XK6\n}\n\nfragment AccountLink_data on AccountType {\n  address\n  config\n  isCompromised\n  user {\n    publicUsername\n    id\n  }\n  displayName\n  ...ProfileImage_data\n  ...wallet_accountKey\n  ...accounts_url\n}\n\nfragment AssetMediaAnimation_asset on AssetType {\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaAudio_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaContainer_asset_2V84VL on AssetType {\n  backgroundColor\n  ...AssetMediaEditions_asset_2V84VL\n}\n\nfragment AssetMediaEditions_asset_2V84VL on AssetType {\n  decimals\n}\n\nfragment AssetMediaImage_asset on AssetType {\n  backgroundColor\n  imageUrl\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaPlaceholderImage_asset on AssetType {\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaVideo_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaWebgl_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMedia_asset on AssetType {\n  animationUrl\n  displayImageUrl\n  imageUrl\n  isDelisted\n  ...AssetMediaAnimation_asset\n  ...AssetMediaAudio_asset\n  ...AssetMediaContainer_asset_2V84VL\n  ...AssetMediaImage_asset\n  ...AssetMediaPlaceholderImage_asset\n  ...AssetMediaVideo_asset\n  ...AssetMediaWebgl_asset\n}\n\nfragment CollectionCell_collection on CollectionType {\n  name\n  imageUrl\n  isVerified\n  ...collection_url\n}\n\nfragment CollectionCell_trait on TraitType {\n  traitType\n  value\n}\n\nfragment CollectionLink_assetContract on AssetContractType {\n  address\n  blockExplorerLink\n}\n\nfragment CollectionLink_collection on CollectionType {\n  name\n  slug\n  verificationStatus\n  ...collection_url\n}\n\nfragment EventHistory_data_L1XK6 on Query {\n  eventActivity(after: $cursor, bundle: $bundle, archetype: $archetype, first: $count, categories: $categories, collections: $collections, chains: $chains, eventTypes: $eventTypes, identity: $identity, includeHidden: true) {\n    edges {\n      node {\n        collection {\n          ...CollectionCell_collection\n          id\n        }\n        traitCriteria {\n          ...CollectionCell_trait\n          id\n        }\n        itemQuantity\n        item @include(if: $showAll) {\n          __typename\n          relayId\n          verificationStatus\n          ...ItemCell_data\n          ...item_url\n          ... on AssetType {\n            collection {\n              ...CollectionLink_collection\n              id\n            }\n            assetContract {\n              ...CollectionLink_assetContract\n              id\n            }\n          }\n          ... on AssetBundleType {\n            bundleCollection: collection {\n              ...CollectionLink_collection\n              id\n            }\n          }\n          ... on Node {\n            __isNode: __typename\n            id\n          }\n        }\n        relayId\n        eventTimestamp\n        eventType\n        orderExpired\n        customEventName\n        ...utilsAssetEventLabel\n        creatorFee {\n          unit\n        }\n        devFeePaymentEvent {\n          ...EventTimestamp_data\n          id\n        }\n        fromAccount {\n          address\n          ...AccountLink_data\n          id\n        }\n        perUnitPrice {\n          unit\n          eth\n          usd\n        }\n        endingPriceType {\n          unit\n        }\n        priceType {\n          unit\n        }\n        payment {\n          ...TokenPricePayment\n          id\n        }\n        seller {\n          ...AccountLink_data\n          id\n        }\n        toAccount {\n          ...AccountLink_data\n          id\n        }\n        winnerAccount {\n          ...AccountLink_data\n          id\n        }\n        ...EventTimestamp_data\n        id\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment EventTimestamp_data on AssetEventType {\n  eventTimestamp\n  transaction {\n    blockExplorerLink\n    id\n  }\n}\n\nfragment ItemCell_data on ItemType {\n  __isItemType: __typename\n  __typename\n  name\n  ...item_url\n  ... on AssetType {\n    collection {\n      name\n      id\n    }\n    ...AssetMedia_asset\n  }\n  ... on AssetBundleType {\n    bundleCollection: collection {\n      name\n      id\n    }\n    assetQuantities(first: 30) {\n      edges {\n        node {\n          asset {\n            name\n            ...AssetMedia_asset\n            id\n          }\n          relayId\n          id\n        }\n      }\n    }\n  }\n}\n\nfragment ProfileImage_data on AccountType {\n  imageUrl\n}\n\nfragment TokenPricePayment on PaymentAssetType {\n  symbol\n  chain {\n    identifier\n  }\n  asset {\n    imageUrl\n    assetContract {\n      blockExplorerLink\n      id\n    }\n    id\n  }\n}\n\nfragment accounts_url on AccountType {\n  address\n  user {\n    publicUsername\n    id\n  }\n}\n\nfragment asset_url on AssetType {\n  assetContract {\n    address\n    id\n  }\n  tokenId\n  chain {\n    identifier\n  }\n}\n\nfragment bundle_url on AssetBundleType {\n  slug\n  chain {\n    identifier\n  }\n}\n\nfragment collection_url on CollectionType {\n  slug\n  isCategory\n}\n\nfragment item_url on ItemType {\n  __isItemType: __typename\n  __typename\n  ... on AssetType {\n    ...asset_url\n  }\n  ... on AssetBundleType {\n    ...bundle_url\n  }\n}\n\nfragment utilsAssetEventLabel on AssetEventType {\n  isMint\n  isAirdrop\n  eventType\n}\n\nfragment wallet_accountKey on AccountType {\n  address\n}\n",
        "variables": {
            "archetype": null,
            "bundle": null,
            "collections": [
                `${slug}`
            ],
            "categories": null,
            "chains": null,
            "eventTypes": [
                "AUCTION_CREATED"
            ],
            "cursor": null,
            "count": 32,
            "showAll": true,
            "identity": null
        }
    })
    res = await this.client.request({
        url: `https://opensea.io/__api/graphql/`,
        method: "POST",
        headers: [
            ['authority', 'opensea.io'],
            ['accept', '*/*'],
            ['accept-language', 'en-US,en;q=0.9'],
            ['content-type', 'application/json'],
            // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
            ['origin', 'https://opensea.io'],
            ['referer', 'https://opensea.io/'],
            ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
            ['sec-ch-ua-mobile', '?0'],
            ['sec-ch-ua-platform', '"Windows"'],
            ['sec-fetch-dest', 'empty'],
            ['sec-fetch-mode', 'cors'],
            ['sec-fetch-site', 'same-origin'],
            ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
            ['x-app-id', 'opensea-web'],
            ['x-build-id', 'af2a3f21c162f8953f49c49349206b52e4b71667'],
            ['x-signed-query', 'dc212a3e42833aa98a090bf576bd8966928927b5b746082ad1c1eb96933f6e9a']

        ],
        // headers: [
        //     ['authority', 'opensea.io'],
        //     ['accept', '*/*'],
        //     ['accept-language', 'en-US,en;q=0.9'],
        //     ['content-type', 'application/json'],
        //     // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
        //     ['origin', 'https://opensea.io'],
        //     ['referer', 'https://opensea.io/'],
        //     ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
        //     ['sec-ch-ua-mobile', '?0'],
        //     ['sec-ch-ua-platform', '"Windows"'],
        //     ['sec-fetch-dest', 'empty'],
        //     ['sec-fetch-mode', 'cors'],
        //     ['sec-fetch-site', 'same-origin'],
        //     ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
        //     ['x-app-id', 'opensea-web'],
        //     ['x-build-id', 'af2a3f21c162f8953f49c49349206b52e4b71667'],
        //     ['x-signed-query', 'dc212a3e42833aa98a090bf576bd8966928927b5b746082ad1c1eb96933f6e9a']

        // ],

        "body": payload
    });
    // console.log(res.body);
    let data = JSON.parse(res.body).data;
    // let total_count = data.eventActivity.totalCount;
    let total_count = 400;
    // console.log(data.eventActivity.pageInfo);
    // console.log(atob(data.eventActivity.pageInfo.endCursor));
    let sp = (atob(data.eventActivity.pageInfo.endCursor)).split(':')
    // console.log(sp);
    // console.log(atob(data.eventActivity.pageInfo.endCursor).split(':')[-1]);
    let count = parseInt(sp[sp.length - 1]);
    // console.log(count);
    record = record.concat(data.eventActivity.edges);
    let limit = 1000;
    let all_promise = [];
    for (let i = 31; i < total_count; i = i + 31) {
        count = count - 31;

        cursor = btoa(`arrayconnection:event_timestamp=lte:2022-09-29 01:09:34.563642&event_type=lte:created&pk=lt:${count}`)
        payload = JSON.stringify({
            "id": "EventHistoryQuery",
            "query": "query EventHistoryQuery(\n  $archetype: ArchetypeInputType\n  $bundle: BundleSlug\n  $collections: [CollectionSlug!]\n  $categories: [CollectionSlug!]\n  $chains: [ChainScalar!]\n  $eventTypes: [EventType!]\n  $cursor: String\n  $count: Int = 16\n  $showAll: Boolean = false\n  $identity: IdentityInputType\n) {\n  ...EventHistory_data_L1XK6\n}\n\nfragment AccountLink_data on AccountType {\n  address\n  config\n  isCompromised\n  user {\n    publicUsername\n    id\n  }\n  displayName\n  ...ProfileImage_data\n  ...wallet_accountKey\n  ...accounts_url\n}\n\nfragment AssetMediaAnimation_asset on AssetType {\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaAudio_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaContainer_asset_2V84VL on AssetType {\n  backgroundColor\n  ...AssetMediaEditions_asset_2V84VL\n}\n\nfragment AssetMediaEditions_asset_2V84VL on AssetType {\n  decimals\n}\n\nfragment AssetMediaImage_asset on AssetType {\n  backgroundColor\n  imageUrl\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaPlaceholderImage_asset on AssetType {\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaVideo_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaWebgl_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMedia_asset on AssetType {\n  animationUrl\n  displayImageUrl\n  imageUrl\n  isDelisted\n  ...AssetMediaAnimation_asset\n  ...AssetMediaAudio_asset\n  ...AssetMediaContainer_asset_2V84VL\n  ...AssetMediaImage_asset\n  ...AssetMediaPlaceholderImage_asset\n  ...AssetMediaVideo_asset\n  ...AssetMediaWebgl_asset\n}\n\nfragment CollectionCell_collection on CollectionType {\n  name\n  imageUrl\n  isVerified\n  ...collection_url\n}\n\nfragment CollectionCell_trait on TraitType {\n  traitType\n  value\n}\n\nfragment CollectionLink_assetContract on AssetContractType {\n  address\n  blockExplorerLink\n}\n\nfragment CollectionLink_collection on CollectionType {\n  name\n  slug\n  verificationStatus\n  ...collection_url\n}\n\nfragment EventHistory_data_L1XK6 on Query {\n  eventActivity(after: $cursor, bundle: $bundle, archetype: $archetype, first: $count, categories: $categories, collections: $collections, chains: $chains, eventTypes: $eventTypes, identity: $identity, includeHidden: true) {\n    edges {\n      node {\n        collection {\n          ...CollectionCell_collection\n          id\n        }\n        traitCriteria {\n          ...CollectionCell_trait\n          id\n        }\n        itemQuantity\n        item @include(if: $showAll) {\n          __typename\n          relayId\n          verificationStatus\n          ...ItemCell_data\n          ...item_url\n          ... on AssetType {\n            collection {\n              ...CollectionLink_collection\n              id\n            }\n            assetContract {\n              ...CollectionLink_assetContract\n              id\n            }\n          }\n          ... on AssetBundleType {\n            bundleCollection: collection {\n              ...CollectionLink_collection\n              id\n            }\n          }\n          ... on Node {\n            __isNode: __typename\n            id\n          }\n        }\n        relayId\n        eventTimestamp\n        eventType\n        orderExpired\n        customEventName\n        ...utilsAssetEventLabel\n        creatorFee {\n          unit\n        }\n        devFeePaymentEvent {\n          ...EventTimestamp_data\n          id\n        }\n        fromAccount {\n          address\n          ...AccountLink_data\n          id\n        }\n        perUnitPrice {\n          unit\n          eth\n          usd\n        }\n        endingPriceType {\n          unit\n        }\n        priceType {\n          unit\n        }\n        payment {\n          ...TokenPricePayment\n          id\n        }\n        seller {\n          ...AccountLink_data\n          id\n        }\n        toAccount {\n          ...AccountLink_data\n          id\n        }\n        winnerAccount {\n          ...AccountLink_data\n          id\n        }\n        ...EventTimestamp_data\n        id\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment EventTimestamp_data on AssetEventType {\n  eventTimestamp\n  transaction {\n    blockExplorerLink\n    id\n  }\n}\n\nfragment ItemCell_data on ItemType {\n  __isItemType: __typename\n  __typename\n  name\n  ...item_url\n  ... on AssetType {\n    collection {\n      name\n      id\n    }\n    ...AssetMedia_asset\n  }\n  ... on AssetBundleType {\n    bundleCollection: collection {\n      name\n      id\n    }\n    assetQuantities(first: 30) {\n      edges {\n        node {\n          asset {\n            name\n            ...AssetMedia_asset\n            id\n          }\n          relayId\n          id\n        }\n      }\n    }\n  }\n}\n\nfragment ProfileImage_data on AccountType {\n  imageUrl\n}\n\nfragment TokenPricePayment on PaymentAssetType {\n  symbol\n  chain {\n    identifier\n  }\n  asset {\n    imageUrl\n    assetContract {\n      blockExplorerLink\n      id\n    }\n    id\n  }\n}\n\nfragment accounts_url on AccountType {\n  address\n  user {\n    publicUsername\n    id\n  }\n}\n\nfragment asset_url on AssetType {\n  assetContract {\n    address\n    id\n  }\n  tokenId\n  chain {\n    identifier\n  }\n}\n\nfragment bundle_url on AssetBundleType {\n  slug\n  chain {\n    identifier\n  }\n}\n\nfragment collection_url on CollectionType {\n  slug\n  isCategory\n}\n\nfragment item_url on ItemType {\n  __isItemType: __typename\n  __typename\n  ... on AssetType {\n    ...asset_url\n  }\n  ... on AssetBundleType {\n    ...bundle_url\n  }\n}\n\nfragment utilsAssetEventLabel on AssetEventType {\n  isMint\n  isAirdrop\n  eventType\n}\n\nfragment wallet_accountKey on AccountType {\n  address\n}\n",
            "variables": {
                "archetype": null,
                "bundle": null,
                "collections": [
                    `${slug}`
                ],
                "categories": null,
                "chains": null,
                "eventTypes": [
                    "AUCTION_CREATED"
                ],
                "cursor": cursor,
                "count": 32,
                "showAll": true,
                "identity": null
            }
        })
        let promise = getData1(payload)
        all_promise.push(promise);
        // await delay(1000);
    }
    for (var item in all_promise) {
        // console.log(all_promise[item]);
        let result = await all_promise[item];

        // console.log(result);
        record = record.concat(result);
    }


    //const result = (await axios.get(`https://platinumtools.s3.ap-southeast-1.amazonaws.com/os-${slug}.json`)).data;
    var result = []

    try {
        result = (await axios.get(`https://platinumtools.s3.ap-southeast-1.amazonaws.com/os-${slug}.json`)).data;

        //check result data and call queue gather
        if (result === null || result == []) {
            try {
                axios.get(`https://qprbaee7t7.execute-api.us-east-1.amazonaws.com/Prod/api/oscollectionrefreshC?collection=${slug}`)
            } catch { }
        }
    } catch { }

    //check result data and call queue gather
    if (result.includes(`<Code>AccessDenied</Code>`)) {
        try {
            axios.get(`https://qprbaee7t7.execute-api.us-east-1.amazonaws.com/Prod/api/oscollectionrefreshC?collection=${slug}`)
        } catch { }
    }

    const supply = await getSupply(contractAddress);
    record.forEach(item => {
        let obj = result.find(o => o.t === item.node.item.tokenId);
        if (obj != undefined) {
            item.rarity = parseInt(obj.r);
            let p = (item.rarity / supply) * 100;
            if (p < 2)
                item.type = "Legendary";
            else if (p < 8)
                item.type = "Epic";
            else if (p < 15)
                item.type = "Rare";
            else if (p < 25)
                item.type = "Uncommon";
            else
                item.type = "Common";
        }

    })
    return record;
}
const getData1 = async (payload) => {
    try {

        var randomNumber = Math.floor(Math.random() * presetArray.length);



        this.client = new Client();
        await this.client.init({
            type: "preset",
            preset: presetArray[randomNumber].preset,
        });

        res = await this.client.request({

            url: `https://opensea.io/__api/graphql/`,
            method: "POST",
            headers: [
                ['authority', 'opensea.io'],
                ['accept', '*/*'],
                ['accept-language', 'en-US,en;q=0.9'],
                ['content-type', 'application/json'],
                // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
                ['origin', 'https://opensea.io'],
                ['referer', 'https://opensea.io/'],
                ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
                ['sec-ch-ua-mobile', '?0'],
                ['sec-ch-ua-platform', '"Windows"'],
                ['sec-fetch-dest', 'empty'],
                ['sec-fetch-mode', 'cors'],
                ['sec-fetch-site', 'same-origin'],
                ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
                ['x-app-id', 'opensea-web'],
                ['x-build-id', 'af2a3f21c162f8953f49c49349206b52e4b71667'],
                ['x-signed-query', 'dc212a3e42833aa98a090bf576bd8966928927b5b746082ad1c1eb96933f6e9a']

            ],
            "body": payload
        });
        return JSON.parse(res.body).data.eventActivity.edges;

    }
    catch (e) {

    }
    return [];

}

const getData = async (payload) => {

    try {



        var randomNumber = Math.floor(Math.random() * presetArray.length);



        this.client = new Client();
        await this.client.init({
            type: "preset",
            preset: presetArray[randomNumber].preset,
        });

        res = await this.client.request({

            url: `https://opensea.io/__api/graphql/`,
            method: "POST",
            headers: [
                ['authority', 'opensea.io'],
                ['accept', '*/*'],
                ['accept-language', 'en-US,en;q=0.9'],
                ['content-type', 'application/json'],
                // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
                ['origin', 'https://opensea.io'],
                ['referer', 'https://opensea.io/'],
                ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
                ['sec-ch-ua-mobile', '?0'],
                ['sec-ch-ua-platform', '"Windows"'],
                ['sec-fetch-dest', 'empty'],
                ['sec-fetch-mode', 'cors'],
                ['sec-fetch-site', 'same-origin'],
                ['user-agent', presetArray[randomNumber].ua],
                ['x-app-id', 'opensea-web'],
                ['x-build-id', 'af2a3f21c162f8953f49c49349206b52e4b71667'],
                ['x-signed-query', 'f38da9a94905660d40c749b10dadde5ea0fda60ba0927a8665d354ef7e6f9fe8']

            ],
            "body": payload
        });


        //modified this since the server shuts down on exceptions here
        try {

            return JSON.parse(res.body).data.search.edges;

        } catch (err) {

            console.log(err.message)

            return []
        }
    } catch (err) {

        console.log(`----Internal Exception----`)
        return []

    }



}
const getTraders = async (contractAddress) => {

    // JSON.stringify({
    //     operationName: "CollectionOrderHistory",
    //     variables: {
    //         address: contractAddress,
    //         filter: {
    //             confirmedAt_gte: "2000-09-23T00:31:00.000Z",
    //         },
    //     },
    //     query:
    //         "query CollectionOrderHistory($address: String!, $filter: CollectionOrderHistoryFilterInput) {\n  collection(address: $address) {\n    address\n    slug\n    orderHistory(filter: $filter) {\n      fromAddress\n      priceInEth\n      timestamp\n      toAddress\n      transactionHash\n      token {\n        tokenId\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}",
    // });
    var payload =
        // JSON.stringify({
        //     "operationName": "CollectionOrderHistory",
        //     "variables": {
        //         "address": contractAddress,
        //         "filter": {
        //             "confirmedAt_gte": "2022-08-30T16:08:00.000Z"
        //         }
        //     },
        //     "query": "query CollectionOrderHistory($address: String!, $filter: CollectionOrderHistoryFilterInput) {\n  collection(address: $address) {\n    address\n    slug\n    orderHistory(filter: $filter) {\n      fromAddress\n      priceInEth\n      timestamp\n      toAddress\n      transactionHash\n      token {\n        tokenId\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}"
        // });
        JSON.stringify({
            "operationName": "CollectionOrderHistory",
            "variables": {
                "address": contractAddress,
                "filter": {
                    "confirmedAt_gte": "2022-09-03T12:24:00.000Z"
                }
            },
            "query": "query CollectionOrderHistory($address: String!, $filter: CollectionOrderHistoryFilterInput) {\n  collection(address: $address) {\n    address\n    slug\n    orderHistory(filter: $filter) {\n      fromAddress\n      priceInEth\n      timestamp\n      toAddress\n      transactionHash\n      token {\n        tokenId\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}"
        });

    // var config = {
    //     method: "post",
    //     url: "https://api.icy.tools/graphql",
    //     // headers: {
    //     //     authority: "api.icy.tools",
    //     //     accept: "*/*",
    //     //     "accept-language": "en-US,en;q=0.9",
    //     //     "apollographql-client-name": "icy.tools Web Client",
    //     //     "apollographql-client-version":
    //     //         "d283ad9c81a16e28a84fd90e116359af17b540d3",
    //     //     "content-type": "application/json",
    //     //     // cookie:
    //     //     // "_ga=GA1.1.1791918574.1660040691; AMP_MKTG_8da27444e2=JTdCJTdE; AMP_8da27444e2=JTdCJTIyb3B0T3V0JTIyJTNBZmFsc2UlMkMlMjJkZXZpY2VJZCUyMiUzQSUyMjZhMmNiYmRmLWRkYjQtNDU2MS1iMWY2LWEyNzZmM2UxNDBhMiUyMiUyQyUyMmxhc3RFdmVudFRpbWUlMjIlM0ExNjYwNjY0OTgxOTIwJTJDJTIyc2Vzc2lvbklkJTIyJTNBMTY2MDY2NDc3MDA5NiU3RA==; rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX189WY2hRrUfQUYQM67iwzI2omHV4%2FWB6qE%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX184JLDTTxWPFnQt0Z27%2Fzy5tQdgE9iQcqE%3D; utmSource=icy.tools; utmCampaign=icy-header; utmSetAt=2022-08-26T09:10:26.062Z; _ga_P989M44MNT=GS1.1.1661518415.9.0.1661518419.56.0.0; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX1%2BUmJ8XyGUYdH6G54OJZ6e4mLdeKR94329uJ35s7T4vDz0cZk5jopSH%2FLQqhoIu80%2BKGHHhjIMjMQ%3D%3D; rl_user_id=RudderEncrypt%3AU2FsdGVkX187XP%2FTOhCiu%2F%2FDv%2F8GxcImlF284dVt6g93Tu7KHzd%2B7MUmfORH3hhBG5wpjRBws2wrW5%2B8c46stQ%3D%3D; rl_trait=RudderEncrypt%3AU2FsdGVkX1%2Baxa8wQ9%2FT%2FjOLLfuuMqFIwisZgINCv5k%3D; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHg4OTRmYWNkOWVjZmMyNjEwZWNjZWYzYTdlMDZjM2E3NmNkNjVmODQ1IiwiaWF0IjoxNjYyNTAxMDgxLCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.GSDGtvdqFYbY5YJNqCg8qSvoGS5RoGDBo2pxD4rxX-A; __cf_bm=Q.ny5.K4e93hKa5ILEPXpkJuv_RzriNN5qIyYL2SUt8-1662501146-0-AQ/GeJT7ao53ktyrCWr3ktGG7V2UXK7bXG7JrC05sQrXH4VSM2hmsN+FfZoDju7Wkkj0U4/BzQyFITfvDBYdDHNoVRMmPK5EdqjXpjZAGDlKHqc9J2ToQxeX7QjwILrrHA==; icy-developers-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiYzg5YjVkODMtOTM1MC00NzEzLTk4MjUtYTkwMzM0Y2Y5NDg5IiwiaWF0IjoxNjYyNTAxMTc3LCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ._ZrqxX-HfEH-x7TlOKy_xEcyNw8V7i3e3YCKoxUL41M; _ga_7212E7ZCBS=GS1.1.1662501144.3.1.1662501352.0.0.0; __cuid=ce5619f6812a488daaf2335a0acfe135; amp_fef1e8=15510d01-4004-403d-a9ee-579852315704R...1gcaa5l1h.1gcad10av.1a.2.1c; _ga_PFQM97KPDB=GS1.1.1662498554.1.1.1662501553.0.0.0",
    //     //     origin: "https://icy.tools",
    //     //     referer: "https://icy.tools/",
    //     //     "sec-ch-ua":
    //     //         '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
    //     //     "sec-ch-ua-mobile": "?0",
    //     //     "sec-ch-ua-platform": '"Windows"',
    //     //     "sec-fetch-dest": "empty",
    //     //     "sec-fetch-mode": "cors",
    //     //     "sec-fetch-site": "same-site",
    //     //     "user-agent":
    //     //         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
    //     //     "x-api-key": "5d4c7e03f8594ccea5553094f1244949",
    //     // },
    //     headers: {
    //         // 'authority': 'api.icy.tools',
    //         // 'accept': '*/*',
    //         // 'accept-language': 'en-US,en;q=0.9',
    //         // 'apollographql-client-name': 'icy.tools Web Client',
    //         // 'apollographql-client-version': '406b8f3e2192e293067cd655a904804b872b1248',
    //         // 'content-type': 'application/json',
    //         // 'cookie':
    //         //     // 'rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX18yrO%2FqPKty7A00i13Ns%2FG44e7RkIuq%2BIg%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX1%2BfOfb2x3Olc1CBGUnsvqNoRp%2F7MDWjDGU%3D; _ga=GA1.1.1410678362.1663870692; __cuid=ce5619f6812a488daaf2335a0acfe135; amp_fef1e8=15510d01-4004-403d-a9ee-579852315704R...1gdkml9nc.1gdkmlffi.2.2.4; _ga_PFQM97KPDB=GS1.1.1663920918.2.1.1663920946.0.0.0; icy-developers-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiOTI3YTZhM2MtYWQwZC00YzZmLTgwZjktZDgyYzczMmUwYWY4IiwiaWF0IjoxNjYzOTMyNDM2LCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.OL1zT8nwfZRpUVCTuFPgnXzutfwv7aL2ZIg9dUQWSoY; _ga_7212E7ZCBS=GS1.1.1663932437.32.1.1663932440.0.0.0; __cf_bm=GZB953a5LbsQm7_3kw_TVX4Qm5opreOmQ5F5c10nkLo-1664144699-0-AQK29Voi9TpPnrkAZAenGDr9E/Seef86WYRcLVM9FtQxAD0y+XKPZJWMRaTVzsz59Qet7Jzt+kV9ebNLL9zbCiYn2QjS1dXrTtO82gfgAvP+YFRSdZDkfSJ/p/0hrBSzFQ==; rl_user_id=RudderEncrypt%3AU2FsdGVkX1%2BYJh8mZvVUnNdi%2BofinavBd4ptII4IWA9X34ATI98DZz9sytA6gXaZZVJBX4Gf9otBnOF68hHuaQ%3D%3D; rl_trait=RudderEncrypt%3AU2FsdGVkX19abr6MR3uxi2EJeQp0gXFkgrK7tgKe8bc%3D; rl_group_id=RudderEncrypt%3AU2FsdGVkX1%2B176IIvTQ%2BgnjG2q%2B1ynPciaKinTBE%2F4E%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX1%2B%2B2dhAM1fqw60Agm5FO%2FqPgMIFGzZ1rn8%3D; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX1%2FFkZVcuKRSzsQuIkIirxu0v7NmdDUDl%2F2n8ADGN4jFxQ4fLQVZoyKd8I4MFVLjMMfwpxSptWtJyA%3D%3D',

    //         //     'rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX18yrO%2FqPKty7A00i13Ns%2FG44e7RkIuq%2BIg%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX1%2BfOfb2x3Olc1CBGUnsvqNoRp%2F7MDWjDGU%3D; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHg4OTRmYWNkOWVjZmMyNjEwZWNjZWYzYTdlMDZjM2E3NmNkNjVmODQ1IiwiaWF0IjoxNjYzNzMxNjgxLCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.uKJVOEfB-eL3NcrExVhTXjxjLVafpWzLpBOja5mmJfE; _ga=GA1.1.1410678362.1663870692; __cuid=ce5619f6812a488daaf2335a0acfe135; amp_fef1e8=15510d01-4004-403d-a9ee-579852315704R...1gdkml9nc.1gdkmlffi.2.2.4; _ga_PFQM97KPDB=GS1.1.1663920918.2.1.1663920946.0.0.0; icy-developers-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiOTI3YTZhM2MtYWQwZC00YzZmLTgwZjktZDgyYzczMmUwYWY4IiwiaWF0IjoxNjYzOTMyNDM2LCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.OL1zT8nwfZRpUVCTuFPgnXzutfwv7aL2ZIg9dUQWSoY; _ga_7212E7ZCBS=GS1.1.1663932437.32.1.1663932440.0.0.0; __cf_bm=GZB953a5LbsQm7_3kw_TVX4Qm5opreOmQ5F5c10nkLo-1664144699-0-AQK29Voi9TpPnrkAZAenGDr9E/Seef86WYRcLVM9FtQxAD0y+XKPZJWMRaTVzsz59Qet7Jzt+kV9ebNLL9zbCiYn2QjS1dXrTtO82gfgAvP+YFRSdZDkfSJ/p/0hrBSzFQ==; rl_user_id=RudderEncrypt%3AU2FsdGVkX1%2BYJh8mZvVUnNdi%2BofinavBd4ptII4IWA9X34ATI98DZz9sytA6gXaZZVJBX4Gf9otBnOF68hHuaQ%3D%3D; rl_trait=RudderEncrypt%3AU2FsdGVkX19abr6MR3uxi2EJeQp0gXFkgrK7tgKe8bc%3D; rl_group_id=RudderEncrypt%3AU2FsdGVkX1%2B176IIvTQ%2BgnjG2q%2B1ynPciaKinTBE%2F4E%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX1%2B%2B2dhAM1fqw60Agm5FO%2FqPgMIFGzZ1rn8%3D; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX1%2FFkZVcuKRSzsQuIkIirxu0v7NmdDUDl%2F2n8ADGN4jFxQ4fLQVZoyKd8I4MFVLjMMfwpxSptWtJyA%3D%3D',

    //         // 'origin': 'https://icy.tools',
    //         // 'referer': 'https://icy.tools/',
    //         // 'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
    //         // 'sec-ch-ua-mobile': '?0',
    //         // 'sec-ch-ua-platform': '"Windows"',
    //         // 'sec-fetch-dest': 'empty',
    //         // 'sec-fetch-mode': 'cors',
    //         // 'sec-fetch-site': 'same-site',
    //         // 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
    //         // 'x-security-token': '95a3458a-b91a-4b91-897e-f497184254f8',
    //         // "x-api-key": "5d4c7e03f8594ccea5553094f1244949",
    //         'authority': 'api.icy.tools',
    //         'accept': '*/*',
    //         'accept-language': 'en-US,en;q=0.9',
    //         'apollographql-client-name': 'icy.tools Web Client',
    //         'apollographql-client-version': '4c896ab716826b10f984907f0e7278e9544251ad',
    //         'content-type': 'application/json',
    //         'cookie': 'rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX18yrO%2FqPKty7A00i13Ns%2FG44e7RkIuq%2BIg%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX1%2BfOfb2x3Olc1CBGUnsvqNoRp%2F7MDWjDGU%3D; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHg4OTRmYWNkOWVjZmMyNjEwZWNjZWYzYTdlMDZjM2E3NmNkNjVmODQ1IiwiaWF0IjoxNjYzNzMxNjgxLCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.uKJVOEfB-eL3NcrExVhTXjxjLVafpWzLpBOja5mmJfE; _ga=GA1.1.1410678362.1663870692; icy-developers-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiOTI3YTZhM2MtYWQwZC00YzZmLTgwZjktZDgyYzczMmUwYWY4IiwiaWF0IjoxNjYzOTMyNDM2LCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.OL1zT8nwfZRpUVCTuFPgnXzutfwv7aL2ZIg9dUQWSoY; __cuid=ce5619f6812a488daaf2335a0acfe135; amp_fef1e8=15510d01-4004-403d-a9ee-579852315704R...1geel4p34.1geel4ts6.p.7.10; _ga_PFQM97KPDB=GS1.1.1664791720.6.1.1664791771.0.0.0; _ga_7212E7ZCBS=GS1.1.1664791724.41.1.1664792931.0.0.0; __cf_bm=Sg3xq8P0oIupFEYhLp.A6VMFuVnbn4Xeys5vUyOQC70-1664799479-0-AdO0iwj9eylDJWhGrs955D31nT783SsxYKfzfKo800keGjvaoJsQP+gPNsxJ8coemV/C+LTWhOx9XaERP6WexiPlCRgwZACJTMFdMCjIClCfJkXTR4hiJ3yVm8lSh7r/IQ==; mp_606dec7de8837f2e0819631c0a3066da_mixpanel=%7B%22distinct_id%22%3A%20%2218398adcabe456-070ddaf983962-26021c51-100200-18398adcabf58b%22%2C%22%24device_id%22%3A%20%2218398adcabe456-070ddaf983962-26021c51-100200-18398adcabf58b%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; mp_e950e8f150e2e3d7c790b0ca38b641af_mixpanel=%7B%22distinct_id%22%3A%20%2218398adccbd3e6-06fdcca3f23b7a-26021c51-100200-18398adccbe474%22%2C%22%24device_id%22%3A%20%2218398adccbd3e6-06fdcca3f23b7a-26021c51-100200-18398adccbe474%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; rl_user_id=RudderEncrypt%3AU2FsdGVkX1%2Bza8ScvYGZFxJHpt9bYPO9JiAAYMLdbrdSgHl%2FjzbkYSrkgxK9gaLs6Ff8q5TBTvpyWmP0MUSo1A%3D%3D; rl_trait=RudderEncrypt%3AU2FsdGVkX1%2B5dpaPNO5fPT3KbTsKEa3CbAlHGVwXFrM%3D; rl_group_id=RudderEncrypt%3AU2FsdGVkX1%2BPpieJSGbuRwmpudnz74jFbha7v1Aalm0%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX1%2BREyc%2FaASvKcXGw6E46Zir9ZAoRjzmiws%3D; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX1%2FFPU5AkVH%2FUWi1MgqjmvLkh4tSiooH7sYir1BSOkcO%2FlJn1hov6FLH3f3bGuJo7LWQNornEhJq0Q%3D%3D',
    //         'origin': 'https://icy.tools',
    //         'referer': 'https://icy.tools/',
    //         'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
    //         'sec-ch-ua-mobile': '?0',
    //         'sec-ch-ua-platform': '"Windows"',
    //         'sec-fetch-dest': 'empty',
    //         'sec-fetch-mode': 'cors',
    //         'sec-fetch-site': 'same-site',
    //         'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
    //         'x-security-token': '0790fc80-a798-4a79-99e8-0d9e846eff7f'

    //     },
    //     data: payload,
    // };

    payload = JSON.stringify({
        "operationName": "CollectionOrderHistory",
        "variables": {
            "address": contractAddress,
            "filter": {
                "confirmedAt_gte": "2022-09-03T12:24:00.000Z"
            }
        },
        "query": "query CollectionOrderHistory($address: String!, $filter: CollectionOrderHistoryFilterInput) {\n  collection(address: $address) {\n    address\n    slug\n    orderHistory(filter: $filter) {\n      fromAddress\n      priceInEth\n      timestamp\n      toAddress\n      transactionHash\n      token {\n        tokenId\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}"
    });

    var config = {
        method: 'post',
        url: 'https://api.icy.tools/graphql',
        headers: {
            'authority': 'api.icy.tools',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'apollographql-client-name': 'icy.tools Web Client',
            'apollographql-client-version': '4c896ab716826b10f984907f0e7278e9544251ad',
            'content-type': 'application/json',
            'cookie': 'rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX18yrO%2FqPKty7A00i13Ns%2FG44e7RkIuq%2BIg%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX1%2BfOfb2x3Olc1CBGUnsvqNoRp%2F7MDWjDGU%3D; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHg4OTRmYWNkOWVjZmMyNjEwZWNjZWYzYTdlMDZjM2E3NmNkNjVmODQ1IiwiaWF0IjoxNjYzNzMxNjgxLCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.uKJVOEfB-eL3NcrExVhTXjxjLVafpWzLpBOja5mmJfE; _ga=GA1.1.1410678362.1663870692; icy-developers-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiOTI3YTZhM2MtYWQwZC00YzZmLTgwZjktZDgyYzczMmUwYWY4IiwiaWF0IjoxNjYzOTMyNDM2LCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.OL1zT8nwfZRpUVCTuFPgnXzutfwv7aL2ZIg9dUQWSoY; __cuid=ce5619f6812a488daaf2335a0acfe135; amp_fef1e8=15510d01-4004-403d-a9ee-579852315704R...1geel4p34.1geel4ts6.p.7.10; _ga_PFQM97KPDB=GS1.1.1664791720.6.1.1664791771.0.0.0; _ga_7212E7ZCBS=GS1.1.1664791724.41.1.1664792931.0.0.0; __cf_bm=Sg3xq8P0oIupFEYhLp.A6VMFuVnbn4Xeys5vUyOQC70-1664799479-0-AdO0iwj9eylDJWhGrs955D31nT783SsxYKfzfKo800keGjvaoJsQP+gPNsxJ8coemV/C+LTWhOx9XaERP6WexiPlCRgwZACJTMFdMCjIClCfJkXTR4hiJ3yVm8lSh7r/IQ==; mp_606dec7de8837f2e0819631c0a3066da_mixpanel=%7B%22distinct_id%22%3A%20%2218398adcabe456-070ddaf983962-26021c51-100200-18398adcabf58b%22%2C%22%24device_id%22%3A%20%2218398adcabe456-070ddaf983962-26021c51-100200-18398adcabf58b%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; mp_e950e8f150e2e3d7c790b0ca38b641af_mixpanel=%7B%22distinct_id%22%3A%20%2218398adccbd3e6-06fdcca3f23b7a-26021c51-100200-18398adccbe474%22%2C%22%24device_id%22%3A%20%2218398adccbd3e6-06fdcca3f23b7a-26021c51-100200-18398adccbe474%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; rl_user_id=RudderEncrypt%3AU2FsdGVkX1%2Bza8ScvYGZFxJHpt9bYPO9JiAAYMLdbrdSgHl%2FjzbkYSrkgxK9gaLs6Ff8q5TBTvpyWmP0MUSo1A%3D%3D; rl_trait=RudderEncrypt%3AU2FsdGVkX1%2B5dpaPNO5fPT3KbTsKEa3CbAlHGVwXFrM%3D; rl_group_id=RudderEncrypt%3AU2FsdGVkX1%2BPpieJSGbuRwmpudnz74jFbha7v1Aalm0%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX1%2BREyc%2FaASvKcXGw6E46Zir9ZAoRjzmiws%3D; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX1%2FFPU5AkVH%2FUWi1MgqjmvLkh4tSiooH7sYir1BSOkcO%2FlJn1hov6FLH3f3bGuJo7LWQNornEhJq0Q%3D%3D',
            'origin': 'https://icy.tools',
            'referer': 'https://icy.tools/',
            'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
            'x-security-token': '0790fc80-a798-4a79-99e8-0d9e846eff7f'
        },
        data: payload
    };
    // console.log(await axios(config));

    const { data } = await axios(config);
    // console.log(data);
    try {
        // priceInEth
        // let array = data.data.collection.orderHistory;
        var seenNames = {};
        let array = data.data.collection.orderHistory.filter(function (currentObject) {
            if (currentObject.toAddress in seenNames) {
                return false;
            } else {
                // total_unique++;
                seenNames[currentObject.toAddress] = true;
                return true;
            }
        });

        array.forEach((node) => node.cnt = 0)


        array.forEach(item => {
            for (var cnt = 0; cnt < data.data.collection.orderHistory.length; cnt++) {
                if (item['toAddress'] == data.data.collection.orderHistory[cnt]['toAddress']) {
                    item['cnt']++;
                }
            }
        })
        var top_buyer = array.sort((a, b) => b.cnt - a.cnt).slice(0, 4);

        seenNames = {};
        array = data.data.collection.orderHistory.filter(function (currentObject) {
            if (currentObject.fromAddress in seenNames) {
                return false;
            } else {
                // total_unique++;
                seenNames[currentObject.fromAddress] = true;
                return true;
            }
        });
        array.forEach((node) => node.cnt = 0)


        array.forEach(item => {
            for (var cnt = 0; cnt < data.data.collection.orderHistory.length; cnt++) {
                if (item['fromAddress'] == data.data.collection.orderHistory[cnt]['fromAddress']) {
                    item['cnt']++;
                }
            }
        })
        var top_sellers = array.sort((a, b) => b.cnt - a.cnt).slice(0, 4);
        const slug = (await getCollectionSlug(contractAddress)).slug;
        // console.log(slug);
        // console.log(`https://platinumtools.s3.ap-southeast-1.amazonaws.com/os-${slug}.json`);


        //const result = (await axios.get(`https://platinumtools.s3.ap-southeast-1.amazonaws.com/os-${slug}.json`)).data;
        var result = []

        try {
            result = (await axios.get(`https://platinumtools.s3.ap-southeast-1.amazonaws.com/os-${slug}.json`)).data;

            //check result data and call queue gather
            if (result === null || result == []) {
                try {
                    axios.get(`https://qprbaee7t7.execute-api.us-east-1.amazonaws.com/Prod/api/oscollectionrefreshC?collection=${slug}`)
                } catch { }
            }
        } catch { }

        //check result data and call queue gather
        if (result.includes(`<Code>AccessDenied</Code>`)) {
            try {
                axios.get(`https://qprbaee7t7.execute-api.us-east-1.amazonaws.com/Prod/api/oscollectionrefreshC?collection=${slug}`)
            } catch { }
        }
        // console.log(result);

        // const supply = await getSupply(contractAddress);
        // console.log(supply);
        data.data.collection.orderHistory.forEach(item => {

            let obj = result.find(o => o.t === item.token.tokenId);
            if (obj != undefined)
                item.rarity = parseInt(obj.r);
            let obj_buyer = top_buyer.find(o => o.toAddress === item.toAddress);
            let obj_seller = top_sellers.find(o => o.toAddress === item.toAddress);
            if (obj_seller != undefined) {

                item.type = "top_seller";
                // let p = (item.rarity / supply) * 100;
                // if (p < 2)
                //     item.type = "Legendary";
                // else if (p < 8)
                //     item.type = "Epic";
                // else if (p < 15)
                //     item.type = "Rare";
                // else if (p < 25)
                //     item.type = "Uncommon";
                // else
                //     item.type = "Common";
            }
            else if (obj_buyer != undefined) {
                // item.rarity = parseInt(obj.r);
                item.type = "top_buyer";
                // let p = (item.rarity / supply) * 100;
                // if (p < 2)
                //     item.type = "Legendary";
                // else if (p < 8)
                //     item.type = "Epic";
                // else if (p < 15)
                //     item.type = "Rare";
                // else if (p < 25)
                //     item.type = "Uncommon";
                // else
                //     item.type = "Common";
            }
            else {
                item.rarity = 0;
                item.type = "Common";
            }

        });

        return { "top_buyer": top_buyer, "top_sellers": top_sellers, "orders": data.data.collection.orderHistory };
    }
    catch (e) {
        console.log(e);
    }

}
// const getTraders = async (contractAddress) => {

//     // JSON.stringify({
//     //     operationName: "CollectionOrderHistory",
//     //     variables: {
//     //         address: contractAddress,
//     //         filter: {
//     //             confirmedAt_gte: "2000-09-23T00:31:00.000Z",
//     //         },
//     //     },
//     //     query:
//     //         "query CollectionOrderHistory($address: String!, $filter: CollectionOrderHistoryFilterInput) {\n  collection(address: $address) {\n    address\n    slug\n    orderHistory(filter: $filter) {\n      fromAddress\n      priceInEth\n      timestamp\n      toAddress\n      transactionHash\n      token {\n        tokenId\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}",
//     // });
//     var payload =
//         JSON.stringify({
//             "operationName": "CollectionOrderHistory",
//             "variables": {
//                 "address": contractAddress,
//                 "filter": {
//                     "confirmedAt_gte": "2022-08-30T16:08:00.000Z"
//                 }
//             },
//             "query": "query CollectionOrderHistory($address: String!, $filter: CollectionOrderHistoryFilterInput) {\n  collection(address: $address) {\n    address\n    slug\n    orderHistory(filter: $filter) {\n      fromAddress\n      priceInEth\n      timestamp\n      toAddress\n      transactionHash\n      token {\n        tokenId\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}"
//         });

//     var config = {
//         method: "post",
//         url: "https://api.icy.tools/graphql",
//         // headers: {
//         //     authority: "api.icy.tools",
//         //     accept: "*/*",
//         //     "accept-language": "en-US,en;q=0.9",
//         //     "apollographql-client-name": "icy.tools Web Client",
//         //     "apollographql-client-version":
//         //         "d283ad9c81a16e28a84fd90e116359af17b540d3",
//         //     "content-type": "application/json",
//         //     // cookie:
//         //     // "_ga=GA1.1.1791918574.1660040691; AMP_MKTG_8da27444e2=JTdCJTdE; AMP_8da27444e2=JTdCJTIyb3B0T3V0JTIyJTNBZmFsc2UlMkMlMjJkZXZpY2VJZCUyMiUzQSUyMjZhMmNiYmRmLWRkYjQtNDU2MS1iMWY2LWEyNzZmM2UxNDBhMiUyMiUyQyUyMmxhc3RFdmVudFRpbWUlMjIlM0ExNjYwNjY0OTgxOTIwJTJDJTIyc2Vzc2lvbklkJTIyJTNBMTY2MDY2NDc3MDA5NiU3RA==; rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX189WY2hRrUfQUYQM67iwzI2omHV4%2FWB6qE%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX184JLDTTxWPFnQt0Z27%2Fzy5tQdgE9iQcqE%3D; utmSource=icy.tools; utmCampaign=icy-header; utmSetAt=2022-08-26T09:10:26.062Z; _ga_P989M44MNT=GS1.1.1661518415.9.0.1661518419.56.0.0; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX1%2BUmJ8XyGUYdH6G54OJZ6e4mLdeKR94329uJ35s7T4vDz0cZk5jopSH%2FLQqhoIu80%2BKGHHhjIMjMQ%3D%3D; rl_user_id=RudderEncrypt%3AU2FsdGVkX187XP%2FTOhCiu%2F%2FDv%2F8GxcImlF284dVt6g93Tu7KHzd%2B7MUmfORH3hhBG5wpjRBws2wrW5%2B8c46stQ%3D%3D; rl_trait=RudderEncrypt%3AU2FsdGVkX1%2Baxa8wQ9%2FT%2FjOLLfuuMqFIwisZgINCv5k%3D; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHg4OTRmYWNkOWVjZmMyNjEwZWNjZWYzYTdlMDZjM2E3NmNkNjVmODQ1IiwiaWF0IjoxNjYyNTAxMDgxLCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.GSDGtvdqFYbY5YJNqCg8qSvoGS5RoGDBo2pxD4rxX-A; __cf_bm=Q.ny5.K4e93hKa5ILEPXpkJuv_RzriNN5qIyYL2SUt8-1662501146-0-AQ/GeJT7ao53ktyrCWr3ktGG7V2UXK7bXG7JrC05sQrXH4VSM2hmsN+FfZoDju7Wkkj0U4/BzQyFITfvDBYdDHNoVRMmPK5EdqjXpjZAGDlKHqc9J2ToQxeX7QjwILrrHA==; icy-developers-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiYzg5YjVkODMtOTM1MC00NzEzLTk4MjUtYTkwMzM0Y2Y5NDg5IiwiaWF0IjoxNjYyNTAxMTc3LCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ._ZrqxX-HfEH-x7TlOKy_xEcyNw8V7i3e3YCKoxUL41M; _ga_7212E7ZCBS=GS1.1.1662501144.3.1.1662501352.0.0.0; __cuid=ce5619f6812a488daaf2335a0acfe135; amp_fef1e8=15510d01-4004-403d-a9ee-579852315704R...1gcaa5l1h.1gcad10av.1a.2.1c; _ga_PFQM97KPDB=GS1.1.1662498554.1.1.1662501553.0.0.0",
//         //     origin: "https://icy.tools",
//         //     referer: "https://icy.tools/",
//         //     "sec-ch-ua":
//         //         '"Chromium";v="104", " Not A;Brand";v="99", "Google Chrome";v="104"',
//         //     "sec-ch-ua-mobile": "?0",
//         //     "sec-ch-ua-platform": '"Windows"',
//         //     "sec-fetch-dest": "empty",
//         //     "sec-fetch-mode": "cors",
//         //     "sec-fetch-site": "same-site",
//         //     "user-agent":
//         //         "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36",
//         //     "x-api-key": "5d4c7e03f8594ccea5553094f1244949",
//         // },
//         headers: {
//             'authority': 'api.icy.tools',
//             'accept': '*/*',
//             'accept-language': 'en-US,en;q=0.9',
//             'apollographql-client-name': 'icy.tools Web Client',
//             'apollographql-client-version': '406b8f3e2192e293067cd655a904804b872b1248',
//             'content-type': 'application/json',
//             'cookie':
//                 // 'rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX18yrO%2FqPKty7A00i13Ns%2FG44e7RkIuq%2BIg%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX1%2BfOfb2x3Olc1CBGUnsvqNoRp%2F7MDWjDGU%3D; _ga=GA1.1.1410678362.1663870692; __cuid=ce5619f6812a488daaf2335a0acfe135; amp_fef1e8=15510d01-4004-403d-a9ee-579852315704R...1gdkml9nc.1gdkmlffi.2.2.4; _ga_PFQM97KPDB=GS1.1.1663920918.2.1.1663920946.0.0.0; icy-developers-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiOTI3YTZhM2MtYWQwZC00YzZmLTgwZjktZDgyYzczMmUwYWY4IiwiaWF0IjoxNjYzOTMyNDM2LCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.OL1zT8nwfZRpUVCTuFPgnXzutfwv7aL2ZIg9dUQWSoY; _ga_7212E7ZCBS=GS1.1.1663932437.32.1.1663932440.0.0.0; __cf_bm=GZB953a5LbsQm7_3kw_TVX4Qm5opreOmQ5F5c10nkLo-1664144699-0-AQK29Voi9TpPnrkAZAenGDr9E/Seef86WYRcLVM9FtQxAD0y+XKPZJWMRaTVzsz59Qet7Jzt+kV9ebNLL9zbCiYn2QjS1dXrTtO82gfgAvP+YFRSdZDkfSJ/p/0hrBSzFQ==; rl_user_id=RudderEncrypt%3AU2FsdGVkX1%2BYJh8mZvVUnNdi%2BofinavBd4ptII4IWA9X34ATI98DZz9sytA6gXaZZVJBX4Gf9otBnOF68hHuaQ%3D%3D; rl_trait=RudderEncrypt%3AU2FsdGVkX19abr6MR3uxi2EJeQp0gXFkgrK7tgKe8bc%3D; rl_group_id=RudderEncrypt%3AU2FsdGVkX1%2B176IIvTQ%2BgnjG2q%2B1ynPciaKinTBE%2F4E%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX1%2B%2B2dhAM1fqw60Agm5FO%2FqPgMIFGzZ1rn8%3D; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX1%2FFkZVcuKRSzsQuIkIirxu0v7NmdDUDl%2F2n8ADGN4jFxQ4fLQVZoyKd8I4MFVLjMMfwpxSptWtJyA%3D%3D',

//                 'rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX18yrO%2FqPKty7A00i13Ns%2FG44e7RkIuq%2BIg%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX1%2BfOfb2x3Olc1CBGUnsvqNoRp%2F7MDWjDGU%3D; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHg4OTRmYWNkOWVjZmMyNjEwZWNjZWYzYTdlMDZjM2E3NmNkNjVmODQ1IiwiaWF0IjoxNjYzNzMxNjgxLCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.uKJVOEfB-eL3NcrExVhTXjxjLVafpWzLpBOja5mmJfE; _ga=GA1.1.1410678362.1663870692; __cuid=ce5619f6812a488daaf2335a0acfe135; amp_fef1e8=15510d01-4004-403d-a9ee-579852315704R...1gdkml9nc.1gdkmlffi.2.2.4; _ga_PFQM97KPDB=GS1.1.1663920918.2.1.1663920946.0.0.0; icy-developers-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiOTI3YTZhM2MtYWQwZC00YzZmLTgwZjktZDgyYzczMmUwYWY4IiwiaWF0IjoxNjYzOTMyNDM2LCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.OL1zT8nwfZRpUVCTuFPgnXzutfwv7aL2ZIg9dUQWSoY; _ga_7212E7ZCBS=GS1.1.1663932437.32.1.1663932440.0.0.0; __cf_bm=GZB953a5LbsQm7_3kw_TVX4Qm5opreOmQ5F5c10nkLo-1664144699-0-AQK29Voi9TpPnrkAZAenGDr9E/Seef86WYRcLVM9FtQxAD0y+XKPZJWMRaTVzsz59Qet7Jzt+kV9ebNLL9zbCiYn2QjS1dXrTtO82gfgAvP+YFRSdZDkfSJ/p/0hrBSzFQ==; rl_user_id=RudderEncrypt%3AU2FsdGVkX1%2BYJh8mZvVUnNdi%2BofinavBd4ptII4IWA9X34ATI98DZz9sytA6gXaZZVJBX4Gf9otBnOF68hHuaQ%3D%3D; rl_trait=RudderEncrypt%3AU2FsdGVkX19abr6MR3uxi2EJeQp0gXFkgrK7tgKe8bc%3D; rl_group_id=RudderEncrypt%3AU2FsdGVkX1%2B176IIvTQ%2BgnjG2q%2B1ynPciaKinTBE%2F4E%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX1%2B%2B2dhAM1fqw60Agm5FO%2FqPgMIFGzZ1rn8%3D; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX1%2FFkZVcuKRSzsQuIkIirxu0v7NmdDUDl%2F2n8ADGN4jFxQ4fLQVZoyKd8I4MFVLjMMfwpxSptWtJyA%3D%3D',
//             'origin': 'https://icy.tools',
//             'referer': 'https://icy.tools/',
//             'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
//             'sec-ch-ua-mobile': '?0',
//             'sec-ch-ua-platform': '"Windows"',
//             'sec-fetch-dest': 'empty',
//             'sec-fetch-mode': 'cors',
//             'sec-fetch-site': 'same-site',
//             'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
//             'x-security-token': '255d0f6c-a3f2-4718-83c6-262d49faead0',
//             "x-api-key": "5d4c7e03f8594ccea5553094f1244949",
//         },
//         data: payload,
//     };


//     const { data } = await axios(config);
//     // priceInEth
//     // let array = data.data.collection.orderHistory;
//     var seenNames = {};
//     let array = data.data.collection.orderHistory.filter(function (currentObject) {
//         if (currentObject.toAddress in seenNames) {
//             return false;
//         } else {
//             // total_unique++;
//             seenNames[currentObject.toAddress] = true;
//             return true;
//         }
//     });

//     array.forEach((node) => node.cnt = 0)


//     array.forEach(item => {
//         for (var cnt = 0; cnt < data.data.collection.orderHistory.length; cnt++) {
//             if (item['toAddress'] == data.data.collection.orderHistory[cnt]['toAddress']) {
//                 item['cnt']++;
//             }
//         }
//     })
//     var top_buyer = array.sort((a, b) => b.cnt - a.cnt).slice(0, 4);

//     seenNames = {};
//     array = data.data.collection.orderHistory.filter(function (currentObject) {
//         if (currentObject.fromAddress in seenNames) {
//             return false;
//         } else {
//             // total_unique++;
//             seenNames[currentObject.fromAddress] = true;
//             return true;
//         }
//     });
//     array.forEach((node) => node.cnt = 0)


//     array.forEach(item => {
//         for (var cnt = 0; cnt < data.data.collection.orderHistory.length; cnt++) {
//             if (item['fromAddress'] == data.data.collection.orderHistory[cnt]['fromAddress']) {
//                 item['cnt']++;
//             }
//         }
//     })
//     var top_sellers = array.sort((a, b) => b.cnt - a.cnt).slice(0, 4);
//     const slug = (await getCollectionSlug(contractAddress)).slug;

//     const result = (await axios.get(`https://platinumtools.s3.ap-southeast-1.amazonaws.com/os-${slug}.json`)).data;
//     // console.log(result);

//     // const supply = await getSupply(contractAddress);
//     // console.log(supply);
//     data.data.collection.orderHistory.forEach(item => {

//         let obj = result.find(o => o.t === item.token.tokenId);
//         if (obj != undefined)
//             item.rarity = parseInt(obj.r);
//         let obj_buyer = top_buyer.find(o => o.toAddress === item.toAddress);
//         let obj_seller = top_sellers.find(o => o.toAddress === item.toAddress);
//         if (obj_seller != undefined) {

//             item.type = "top_seller";
//             // let p = (item.rarity / supply) * 100;
//             // if (p < 2)
//             //     item.type = "Legendary";
//             // else if (p < 8)
//             //     item.type = "Epic";
//             // else if (p < 15)
//             //     item.type = "Rare";
//             // else if (p < 25)
//             //     item.type = "Uncommon";
//             // else
//             //     item.type = "Common";
//         }
//         else if (obj_buyer != undefined) {
//             // item.rarity = parseInt(obj.r);
//             item.type = "top_buyer";
//             // let p = (item.rarity / supply) * 100;
//             // if (p < 2)
//             //     item.type = "Legendary";
//             // else if (p < 8)
//             //     item.type = "Epic";
//             // else if (p < 15)
//             //     item.type = "Rare";
//             // else if (p < 25)
//             //     item.type = "Uncommon";
//             // else
//             //     item.type = "Common";
//         }
//         else {
//             item.rarity = 0;
//             item.type = "Common";
//         }

//     });

//     return { "top_buyer": top_buyer, "top_sellers": top_sellers, "orders": data.data.collection.orderHistory };


// }
const saveSalesData = async (contractAddress, timeInterval) => {
    const nowTime = new Date();
    const prevTime = new Date(nowTime.getTime() - 1000 * 60 * timeInterval);
    const salesStats = (await axios.get(`https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&occurred_before=${formatDate(nowTime)}&occurred_after=${formatDate(prevTime)}&event_type=successful`, options)).data;
    // console.log(salesStats);
    const salesHistory = {};
    var key = "SalesHistory";
    salesHistory[key] = [];
    var query = "DELETE FROM sales";
    sql.query(query, function (err, result) {
        if (err) throw err;
        console.log("All records has been deleted");
    });

    for (var timeCount = nowTime.getTime(); timeCount > prevTime.getTime(); timeCount -= 1000 * 60 * timeInterval / MiniInterval) {
        var volume = 0;
        var itemNum = 0;
        salesStats['asset_events'].map(item => {
            if (item['listing_time'] == null) {
                const unix = new Date(item['event_timestamp']);
                if (unix.getTime() < timeCount && unix.getTime() > (timeCount - 1000 * 60 * timeInterval / MiniInterval)) {
                    volume += item['total_price'] / (10 ** 18);
                    itemNum++;
                }
            }
        })
        console.log(' item num' + itemNum + ' volume' + volume);

        const record = {};
        record['start_date'] = formatDate(new Date(timeCount - 1000 * 60 * timeInterval / MiniInterval));
        record['end_date'] = formatDate(new Date(timeCount));
        record['volume'] = volume;
        record['avg_volume'] = itemNum == 0 ? volume = 0 : volume / itemNum;
        record['item_num'] = itemNum;

        salesHistory[key].push(record);

        sql.query(`INSERT INTO sales (start_date, end_date, volume, avg_volume, item_num) VALUES ('${formatDate(new Date(timeCount - 1000 * 60 * timeInterval / MiniInterval))}', '${formatDate(new Date(timeCount))}', ${volume}, ${itemNum == 0 ? volume = 0 : volume / itemNum}, ${itemNum})`, function (err) {
            if (err) throw err;
            console.log("1 record inserted");
        });
    }
    return salesHistory;
}

const saveListingData = async (contractAddress, timeInterval) => {
    const slug = (await getCollectionSlug(contractAddress)).slug;
    var d = new Date();
    d.setDate(d.getDate() - 1);
    var datetime = d.toISOString();

    const collectioninfo = (await getCollectionInfo(slug)).collectionInfo;
    //  start_date: datetime, end_date: new Date().toISOString(),

    const collectionStats = await getAllEvents({ contract_address: contractAddress, total_limit: 750 });


    const assetData = collectionStats;

    const salesData = {};
    var key = "ListingHistory";
    salesData[key] = [];

    assetData.forEach(item => {

        if (item['listing_time'] != null) {
            // console.log(item);
            const record = {};
            record['id'] = item['asset']['id'];
            record['name'] = item['asset']['name'];
            record['image_url'] = item['asset']['image_url'];

            if (item['payment_token'] !== null)
                record['market_image_url'] = item['payment_token']['image_url'];
            else
                record['market_image_url'] = '';

            record['listing_date'] = item['event_timestamp'].replace(/T/, ' ').replace(/\..+/, '');
            record['listing_price'] = item['starting_price'] / (10 ** 18) + " ETH";

            if (item['asset']['name'].indexOf('#') > 0)
                record['rarity'] = Number(item['asset']['name'].split('#')[1]);
            else
                record['rarity'] = 0;
            record['buy_rank'] = Math.floor(record['rarity'] / 10) + 25;
            if ((record['rarity'] / collectioninfo.stats.total_supply) * 100 > 25) {
                record['type'] = 'Common';
            }
            else if ((record['rarity'] / collectioninfo.stats.total_supply) * 100 > 15) {
                record['type'] = 'Uncommon';
            }
            else if ((record['rarity'] / collectioninfo.stats.total_supply) * 100 > 8) {
                record['type'] = 'Rare';
            }
            else if ((record['rarity'] / collectioninfo.stats.total_supply) * 100 > 2) {
                record['type'] = 'Epic';
            }
            else {
                record['type'] = 'Legendary';
            }
            salesData[key].push(record);

        }

    });
    // console.log(salesData[key]);
    return salesData;

    const nowTime = new Date();
    const prevTime = new Date(nowTime.getTime() - 1000 * 60 * timeInterval);
    const salesStats = (await axios.get(`https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&occurred_before=${formatDate(nowTime)}&occurred_after=${formatDate(prevTime)}&event_type=successful`, options)).data;
    const listingHistory = {};
    var key = "ListingHistory";
    listingHistory[key] = [];
    var query = "DELETE FROM listing";
    sql.query(query, function (err, result) {
        if (err) throw err;
        console.log("All records has been deleted");
    });

    for (var timeCount = nowTime.getTime(); timeCount > prevTime.getTime(); timeCount -= 1000 * 60 * timeInterval / MiniInterval) {
        var volume = 0;
        var itemNum = 0;
        salesStats['asset_events'].map(item => {
            if (item['listing_time'] != null) {
                const unix = new Date(item['event_timestamp']);
                if (unix.getTime() < timeCount && unix.getTime() > (timeCount - 1000 * 60 * timeInterval / MiniInterval)) {
                    volume += item['total_price'] / (10 ** 18);
                    itemNum++;
                }
            }
        })

        const record = {};
        record['start_date'] = formatDate(new Date(timeCount - 1000 * 60 * timeInterval / MiniInterval));
        record['end_date'] = formatDate(new Date(timeCount));
        record['volume'] = volume;
        record['avg_volume'] = itemNum == 0 ? volume = 0 : volume / itemNum;
        record['item_num'] = itemNum;
        if (0 < record['start_date'] && record['start_date'] < 1000 * 60 * timeInterval / 8)
            record['type'] = 'Legendary';
        if (1000 * 60 * timeInterval / 8 < record['start_date'] && record['start_date'] < 1000 * 60 * timeInterval / 4)
            record['type'] = 'Epic';
        if (1000 * 60 * timeInterval / 4 < record['start_date'] && record['start_date'] < 1000 * 60 * timeInterval * 3 / 5)
            record['type'] = 'Rare';
        if (1000 * 60 * timeInterval * 3 / 5 < record['start_date'] && record['start_date'] < 1000 * 60 * timeInterval * 3 / 4)
            record['type'] = 'Uncommon';
        if (1000 * 60 * timeInterval * 3 / 4 < record['start_date'] && record['start_date'] < 1000 * 60 * timeInterval)
            record['type'] = 'Common';
        listingHistory[key].push(record);

        sql.query(`INSERT INTO listing (start_date, end_date, volume, avg_volume, item_num) VALUES ('${formatDate(new Date(timeCount - 1000 * 60 * timeInterval / MiniInterval))}', '${formatDate(new Date(timeCount))}', ${volume}, ${itemNum == 0 ? volume = 0 : volume / itemNum}, ${itemNum})`, function (err) {
            if (err) throw err;
            // console.log("1 record inserted");
        });
    }

    return listingHistory;
}

const assetsForSales = async (contractAddress, timeInterval) => {
    const nowTime = new Date();
    const prevTime = new Date(nowTime.getTime() - 1000 * 60 * timeInterval);
    const salesStats = (await axios.get(`https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&occurred_before=${formatDate(nowTime)}&occurred_after=${formatDate(prevTime)}&event_type=successful`, options)).data;
    // console.log(`https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&occurred_before=${formatDate(nowTime)}&occurred_after=${formatDate(prevTime)}&event_type=successful`);
    // console.log(salesStats);
    const listingHistory = {};
    var key = "ListingHistory";
    listingHistory[key] = [];
    var query = "DELETE FROM assetsForSales";
    sql.query(query, function (err, result) {
        if (err) throw err;
        console.log("All records has been deleted");
    });

    for (var timeCount = nowTime.getTime(); timeCount > prevTime.getTime(); timeCount -= 1000 * 60 * timeInterval / (MiniInterval * 100)) {
        var volume = 0;
        var itemNum = 0;
        salesStats['asset_events'].map(item => {
            if (item['listing_time'] != null) {
                const unix = new Date(item['event_timestamp']);
                if (unix.getTime() < timeCount && unix.getTime() > (timeCount - 1000 * 60 * timeInterval / (MiniInterval * 100))) {
                    volume += item['total_price'] / (10 ** 18);
                    itemNum++;
                }
            }
        })

        const record = {};
        record['start_date'] = timeCount - 1000 * 60 * timeInterval / (MiniInterval * 100);
        record['end_date'] = timeCount;
        record['volume'] = volume;
        record['avg_volume'] = itemNum == 0 ? volume = 0 : volume / itemNum;
        record['item_num'] = itemNum;
        listingHistory[key].push(record);

        sql.query(`INSERT INTO assetsForSales (start_date, end_date, volume, avg_volume, item_num) VALUES ('${timeCount - 1000 * 60 * timeInterval / (MiniInterval * 100)}', '${timeCount}', ${volume}, ${itemNum == 0 ? volume = 0 : volume / itemNum}, ${itemNum})`, function (err) {
            if (err) throw err;
            // console.log("1 record inserted");
        });
    }
    return listingHistory;
}

const getSellWall = async (contractAddress, priceInterval) => {
    const collectionStats = (await axios.get(`https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&limit=${LimitNumber}&event_type=successful`, options)).data;
    const assetData = collectionStats["asset_events"];
    const tempArray = [];
    const sellWall = {};
    var keys = 'SellWall';
    sellWall[keys] = [];

    var query = "DELETE FROM sellWall";
    sql.query(query, function (err, result) {
        if (err) throw err;
        console.log("All records has been deleted");
    });

    for (var cnt = 0; cnt < 1500; cnt++) {
        tempArray[cnt] = 0;
    }

    assetData.map(item => {
        if (item['listing_time'] == null) {
            tempArray[parseInt((item['total_price'] / (10 ** 18)) / priceInterval)]++;
        }
    })
    tempArray.map((item, key) => {
        const record = {};
        record['low_price'] = key * priceInterval;
        record['high_price'] = (key + 1) * priceInterval;
        record['main_value'] = item;
        sellWall[keys].push(record);
        sql.query(`INSERT INTO sellWall (low_price, high_price, main_value) VALUES (${key * priceInterval}, ${(key + 1) * priceInterval}, ${item})`, function (err) {
            if (err) throw err;
            console.log("1 record inserted");
        });
    })
    return sellWall;
}

const getHolderInfo = async (contractAddress) => {
    // console.log(contractAddress);
    let collectionData;
    let index = 0;
    let response = [];
    let all_tokens = [];
    // while (true) {
    //     try {
    //         collectionData = (
    //             await axios.get(
    //                 `https://api.opensea.io/api/v1/bundles?asset_contract_address=${contractAddress}&limit=50&offset=${index}`,
    //                 options
    //             )
    //         ).data;
    //         console.log('----------', collectionData);
    //         if (collectionData.bundles.length == 0) {
    //             break;
    //         }
    //         for (let bundle of collectionData.bundles) {
    //             for (let tData of bundle.assets) {
    //                 response.push({
    //                     address: tData.owner.address,
    //                     token_id: tData.token_id,
    //                 });
    //             }
    //         }
    //         index += 50;
    //         await delay(300);
    //     } catch (err) {
    //         console.log("err", err);
    //         break;
    //     }
    // }
    let next = null;
    var payload = JSON.stringify({
        "query": "query Contract($address: String!, $after: String, $first: Int, $filter: LogsFilterInputType) {  contract(address: $address) {    address    tokens(after: $after, first: $first) {      edges {        node {          tokenId          ... on ERC721Token {            ownerAddress\r\n  logs(filter: $filter) {\r\n    edges {\r\n      node {\r\n        estimatedConfirmedAt\r\n        toAddress\r\n      }\r\n    }\r\n  }\r\n}\r\n}      }      pageInfo {       hasNextPage        hasPreviousPage        startCursor        endCursor     }    }\r\n  \r\n}}",
        "variables": {
            "address": contractAddress,

            "after": next,

            "first": 1000
        },
        "operationName": "Contract"
    });


    var config = {
        method: 'post',
        url: 'https://graphql.icy.tools/graphql',
        headers: {
            'authority': 'graphql.icy.tools',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json',
            'origin': 'https://developers.icy.tools',
            'referer': 'https://developers.icy.tools/',
            'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
            'x-api-key': '16db3318d1fb47d0822f65d62fc6f2a1'
        },
        data: payload
    };


    var all_promise = [];
    var number = -1;

    var limit = 10;
    var end = true;
    cursor = null;

    while (end) {
        all_promise = [];
        for (var i = 0; i < limit; i++) {


            payload = JSON.stringify({
                "query": "query Contract($address: String!, $after: String, $first: Int, $filter: LogsFilterInputType) {  contract(address: $address) {    address    tokens(after: $after, first: $first) {      edges {        node {          tokenId          ... on ERC721Token {            ownerAddress\r\n  logs(filter: $filter) {\r\n    edges {\r\n      node {\r\n        estimatedConfirmedAt\r\n        toAddress\r\n      }\r\n    }\r\n  }\r\n}\r\n}      }      pageInfo {       hasNextPage        hasPreviousPage        startCursor        endCursor     }    }\r\n  \r\n}}",
                "variables": {
                    "address": contractAddress,
                    "after": next,


                    "first": 1000
                },
                "operationName": "Contract"
            });;
            config = {
                method: 'post',
                url: 'https://graphql.icy.tools/graphql',
                headers: {
                    'authority': 'graphql.icy.tools',
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                    'origin': 'https://developers.icy.tools',
                    'referer': 'https://developers.icy.tools/',
                    'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-site',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
                    'x-api-key': '16db3318d1fb47d0822f65d62fc6f2a1'
                },
                data: payload
            };
            let promise = getgraphqlrequest(config);
            all_promise.push(promise);
            number = number + 50;

            cursor = btoa(`arrayconnection:${number}`)
            next = cursor;
        }

        for (var item in all_promise) {
            // console.log(all_promise[item]);
            try {
                let result = await all_promise[item];

                // console.log(result);
                result.data.contract.tokens.edges.forEach(element => {
                    var estimatedConfirmedAt = "";
                    let result = element.node.logs.edges.filter(el => {

                        return el.node.toAddress == element.node.ownerAddress
                    });
                    // console.log(result);
                    if (result.length == 0) {
                        // console.log(index);
                        // console.log(element.node.ownerAddress);
                        // console.log(element);
                    }
                    else {
                        estimatedConfirmedAt = result[0].node.estimatedConfirmedAt;

                    }


                    // console.log(element.node.logs.edges);
                    // // console.log(element.node.tokenId);
                    // // console.log(element);
                    // console.log({
                    //     address: element.node.ownerAddress,
                    //     token_id: element.node.tokenId,
                    //     time: estimatedConfirmedAt
                    // });
                    response.push({
                        address: element.node.ownerAddress,
                        token_id: element.node.tokenId,
                        time: estimatedConfirmedAt
                    });
                    all_tokens.push({
                        address: element.node.ownerAddress,
                        token_id: element.node.tokenId,
                        time: estimatedConfirmedAt
                    });
                })
                if (result.data.contract.tokens.pageInfo.hasNextPage == false) {
                    end = false;
                    break;
                }
            }
            catch (e) {

            }

        }
    }
    // while (true) {
    //     try {
    //         payload = JSON.stringify({
    //             "query": "query Contract($address: String!, $after: String, $first: Int, $filter: LogsFilterInputType) {  contract(address: $address) {    address    tokens(after: $after, first: $first) {      edges {        node {          tokenId          ... on ERC721Token {            ownerAddress\r\n  logs(filter: $filter) {\r\n    edges {\r\n      node {\r\n        estimatedConfirmedAt\r\n        toAddress\r\n      }\r\n    }\r\n  }\r\n}\r\n}      }      pageInfo {       hasNextPage        hasPreviousPage        startCursor        endCursor     }    }\r\n  \r\n}}",
    //             "variables": {
    //                 "address": contractAddress,
    //                 "after": next,


    //                 "first": 1000
    //             },
    //             "operationName": "Contract"
    //         });;
    //         config = {
    //             method: 'post',
    //             url: 'https://graphql.icy.tools/graphql',
    //             headers: {
    //                 'authority': 'graphql.icy.tools',
    //                 'accept': '*/*',
    //                 'accept-language': 'en-US,en;q=0.9',
    //                 'content-type': 'application/json',
    //                 'origin': 'https://developers.icy.tools',
    //                 'referer': 'https://developers.icy.tools/',
    //                 'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
    //                 'sec-ch-ua-mobile': '?0',
    //                 'sec-ch-ua-platform': '"Windows"',
    //                 'sec-fetch-dest': 'empty',
    //                 'sec-fetch-mode': 'cors',
    //                 'sec-fetch-site': 'same-site',
    //                 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
    //                 'x-api-key': '16db3318d1fb47d0822f65d62fc6f2a1'
    //             },
    //             data: payload
    //         };
    //         try {
    //             collectionData = (

    //                 await axios(config)
    //             ).data.data.contract.tokens;
    //         }
    //         catch (e) {
    //             console.log(e);
    //             continue;
    //         }
    //         // console.log('----------', collectionData);
    //         if (collectionData.pageInfo.hasNextPage == false) {
    //             collectionData = collectionData.edges;
    //             // console.log("Last one");

    //             collectionData.forEach((element, index) => {

    //                 var estimatedConfirmedAt = "";
    //                 let result = element.node.logs.edges.filter(el => {

    //                     return el.node.toAddress == element.node.ownerAddress
    //                 });
    //                 if (result.length == 0) {
    //                     // console.log(element.node.ownerAddress);
    //                     // console.log(element.node.logs.edges);
    //                 }
    //                 else {
    //                     estimatedConfirmedAt = result[0].estimatedConfirmedAt;

    //                 }

    //                 response.push({
    //                     address: element.node.ownerAddress,
    //                     token_id: element.node.tokenId,
    //                     time: estimatedConfirmedAt
    //                 });
    //                 all_tokens.push({
    //                     address: element.node.ownerAddress,
    //                     token_id: element.node.tokenId,
    //                     time: estimatedConfirmedAt
    //                 });
    //             }

    //             )
    //             break;
    //         }
    //         else {
    //             next = collectionData.pageInfo.endCursor;
    //         }
    //         collectionData = collectionData.edges;
    //         collectionData.forEach((element, index) => {
    //             var estimatedConfirmedAt = "";
    //             let result = element.node.logs.edges.filter(el => {

    //                 return el.node.toAddress == element.node.ownerAddress
    //             });
    //             // console.log(result);
    //             if (result.length == 0) {
    //                 // console.log(index);
    //                 // console.log(element.node.ownerAddress);
    //                 // console.log(element);
    //             }
    //             else {
    //                 estimatedConfirmedAt = result[0].node.estimatedConfirmedAt;

    //             }


    //             // console.log(element.node.logs.edges);
    //             // // console.log(element.node.tokenId);
    //             // // console.log(element);
    //             // console.log({
    //             //     address: element.node.ownerAddress,
    //             //     token_id: element.node.tokenId,
    //             //     time: estimatedConfirmedAt
    //             // });
    //             response.push({
    //                 address: element.node.ownerAddress,
    //                 token_id: element.node.tokenId,
    //                 time: estimatedConfirmedAt
    //             });
    //             all_tokens.push({
    //                 address: element.node.ownerAddress,
    //                 token_id: element.node.tokenId,
    //                 time: estimatedConfirmedAt
    //             });

    //         }

    //         )


    //         // for (let element of collectionData) {
    //         //     for (let tData of bundle.assets) {
    //         //         response.push({
    //         //             address: tData.owner.address,
    //         //             token_id: tData.token_id,
    //         //         });
    //         //     }
    //         // }
    //         index += 50;
    //         // await delay(300);
    //     } catch (err) {
    //         console.log("err", err);
    //         break;
    //     }
    // }

    // console.log(response);
    let arrary = all_tokens.filter((value, index, self) =>
        index === self.findIndex((t) => (
            t.token_id === value.token_id
        ))
    )
    all_tokens = arrary;
    response = arrary;


    const updatedList = Object.values(all_tokens.reduce(
        (map, el) => {
            map[el.address] ? map[el.address].count++ : map[el.address] = {
                ...el,
                count: 1
            };
            return map;
        }, {}
    ));

    let tempArray = [];
    let total_unique = 0;



    var seenNames = {};
    let array = response.filter(function (currentObject) {
        if (currentObject.address in seenNames) {
            return false;
        } else {
            total_unique++;
            seenNames[currentObject.address] = true;
            return true;
        }
    });
    array.forEach((node) => node.cnt = 0)
    array.forEach(item => {
        for (var cnt = 0; cnt < response.length; cnt++) {
            if (item['address'] == response[cnt]['address']) {
                item['cnt']++;
            }
        }
    })
    record = [
        { 'count': 0, 'percentage': 0 },
        { 'count': 0, 'percentage': 0 },
        { 'count': 0, 'percentage': 0 },
        { 'count': 0, 'percentage': 0 }
    ];
    let holder_distribution = [
        { 'count': 0, 'percentage': 0, name: "Group A" },
        { 'count': 0, 'percentage': 0, name: "Group B" },
        { 'count': 0, 'percentage': 0, name: "Group C" },
        { 'count': 0, 'percentage': 0, name: "Group D" },
        { 'count': 0, 'percentage': 0, name: "Group E" },
        { 'count': 0, 'percentage': 0, name: "Group F" }
    ];

    array.map(item => {
        if (item['cnt'] == 1) {
            record[0]['count']++;

        } else if (item['cnt'] <= 3 && item['cnt'] >= 2) {
            record[1]['count']++;
        } else if (item['cnt'] <= 7 && item['cnt'] >= 4) {
            record[2]['count']++;
        } else if (item['cnt'] <= 46 && item['cnt'] >= 7) {
            record[3]['count']++;
        }


        if (item['cnt'] == 1) {
            holder_distribution[0]['count']++;
        } else if (item['cnt'] <= 3 && item['cnt'] >= 2) {
            holder_distribution[1]['count']++;
        } else if (item['cnt'] <= 10 && item['cnt'] >= 4) {
            holder_distribution[2]['count']++;
        } else if (item['cnt'] <= 25 && item['cnt'] >= 11) {
            holder_distribution[3]['count']++;
        } else if (item['cnt'] <= 40 && item['cnt'] >= 26) {
            holder_distribution[4]['count']++;
        } else {
            holder_distribution[5]['count']++;
        }
    })
    record.map(item => {
        item['percentage'] = (item['count'] / array.length * 100).toFixed(3) + "%";
    })
    holder_distribution.map(item => {
        item['percentage'] = (item['count'] / array.length * 100).toFixed(3) + "%";
    })

    var d = new Date();
    var d1 = new Date();
    var d2 = new Date();
    var d3 = new Date();
    var d4 = new Date();
    var d5 = new Date();
    // var d6 = new Date();
    // var d7 = new Date();
    d1.setDate(d1.getDate() - 1);
    d2.setDate(d2.getDate() - 2);
    d3.setDate(d3.getDate() - 3);
    d4.setDate(d4.getDate() - 4);
    d5.setDate(d5.getDate() - 5);
    // d6.setDate(d6.getDate() - 6);
    // d7.setDate(d7.getDate() - 7);




    var record_for_each_day = [
        {
            'time': `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`, date: d.getDate(), month: d.getMonth(), year: d.getFullYear(), 'total_holders': 0, 'unique_holders': 0, holder_distribution: [
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 }
            ]
        },

        {
            'time': `${d1.toLocaleString('default', { month: 'short' })} ${d1.getDate()}`, date: d1.getDate(), month: d1.getMonth(), year: d.getFullYear(), 'total_holders': 0, 'unique_holders': 0, holder_distribution: [
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 }
            ]
        },

        {
            'time': `${d2.toLocaleString('default', { month: 'short' })} ${d2.getDate()}`, date: d2.getDate(), month: d2.getMonth(), year: d.getFullYear(), 'total_holders': 0, 'unique_holders': 0, holder_distribution: [
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 }
            ]
        },

        {
            'time': `${d3.toLocaleString('default', { month: 'short' })} ${d3.getDate()}`, date: d3.getDate(), month: d3.getMonth(), year: d.getFullYear(), 'total_holders': 0, 'unique_holders': 0, holder_distribution: [
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 }
            ]
        },

        {
            'time': `${d4.toLocaleString('default', { month: 'short' })} ${d4.getDate()}`, date: d4.getDate(), month: d4.getMonth(), year: d.getFullYear(), 'total_holders': 0, 'unique_holders': 0, holder_distribution: [
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 }
            ]
        },

        {
            'time': `${d5.toLocaleString('default', { month: 'short' })} ${d5.getDate()}`, date: d5.getDate(), month: d5.getMonth(), year: d.getFullYear(), 'total_holders': 0, 'unique_holders': 0, holder_distribution: [
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 },
                { 'count': 0, 'percentage': 0 }
            ]
        },

        // { 'day': `${d6.toLocaleString('default', { month: 'short' })} ${d6.getDate()}`, year: d.getFullYear(), 'total_holders': 0, 'unique_holders': 0 },
        // { 'day': `${d7.toLocaleString('default', { month: 'short' })} ${d7.getDate()}`, year: d.getFullYear(), 'total_holders': 0, 'unique_holders': 0 }
    ];

    // console.log(record_for_each_day);
    record_for_each_day.forEach((item, index) => {

        // all_tokens.filter((elemet) => { return true });
        // console.log(`${new Date(page1.time).toLocaleString('default', { month: 'short' })} ${new Date(page1.time).getDate()}`, item.day);


        let items = all_tokens.filter((page1) => {
            if (!page1.time)
                return false;
            if (new Date(page1.time).getFullYear() < item.year) {
                return true;
            }
            else if ((new Date(page1.time).getMonth()) < item.month) {
                return true;
            }
            else if (new Date(page1.time).getDate() <= item.date) {
                return true;
            }
            return false;
        });
        let tempArray = JSON.parse(JSON.stringify(array));
        let filtered_items = tempArray.filter((page1) => {
            if (!page1.time)
                return false;
            if (new Date(page1.time).getFullYear() < item.year) {
                return true;
            }
            else if ((new Date(page1.time).getMonth()) < item.month) {
                return true;
            }
            else if (new Date(page1.time).getDate() <= item.date) {
                return true;
            }
            return false;
            // return new Date(page1.time).getFullYear() <= item.year && new Date(page1.time).getMonth() <= item.month && new Date(page1.time).getDate() <= item.date
        });

        filtered_items.map(sub_item => {
            if (sub_item['cnt'] == 1) {
                item.holder_distribution[0]['count']++;

            } else if (sub_item['cnt'] <= 3 && sub_item['cnt'] >= 2) {
                item.holder_distribution[1]['count']++;
            } else if (sub_item['cnt'] <= 7 && sub_item['cnt'] >= 4) {
                item.holder_distribution[2]['count']++;
            } else if (sub_item['cnt'] <= 46 && sub_item['cnt'] >= 7) {
                item.holder_distribution[3]['count']++;
            }



        })
        let unique = 0;
        var seenNames = {};
        let arrays = items.filter(function (currentObject) {
            if (currentObject.address in seenNames) {
                return false;
            } else {
                unique++;
                seenNames[currentObject.address] = true;
                return true;
            }
        });
        seenNames = {};

        let total_holders = items.filter(function (currentObject) {
            if (currentObject.address in seenNames) {
                return false;
            } else {

                return true;
            }
        });
        // console.log(items.length);
        record_for_each_day[index].holders = unique;
        record_for_each_day[index].total_holders = total_holders.length;

    })


    // console.log(record_for_each_day);
    // var date = new Date();
    // all_tokens.forEach(item => {

    // })
    var topValues = array.sort((a, b) => b.cnt - a.cnt).slice(0, 7);
    // console.log(topValues);

    // var date = new Date();
    // console.log(array.length);


    // console.log({ "total_holders": all_tokens.length, "unique minters": total_unique, "record": record });
    return { all_token: all_tokens, topValues: topValues, "total_holders": all_tokens.length, "unique minters": total_unique, "record": record, "holder_distribution": holder_distribution, "record_for_each_day": record_for_each_day };

}


const getMinterInfo = async (contractAddress) => {
    let collectionData;
    let index = 0;
    let response = [];
    let all_tokens = [];

    let next = null;
    var payload = JSON.stringify({
        "query": "query($after: String, $first: Int, $filter: LogsFilterInputType)  {\r\n  logs(after: $after, first: $first, filter: $filter) {\r\n    pageInfo {\r\n      hasNextPage\r\n      hasPreviousPage\r\n      startCursor\r\n      endCursor\r\n    }\r\n    edges {\r\n      node {\r\n        toAddress\r\n        fromAddress\r\n        estimatedConfirmedAt\r\n      }\r\n    }\r\n  }\r\n}\r\n",
        "variables": {
            "after": null,
            "first": null,
            "filter": {
                "typeIn": "MINT",
                "contractAddress": {
                    "eq": contractAddress
                }
            }
        }
    });




    var config = {
        method: 'post',
        url: 'https://graphql.icy.tools/graphql',
        headers: {
            'authority': 'graphql.icy.tools',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json',
            'origin': 'https://developers.icy.tools',
            'referer': 'https://developers.icy.tools/',
            'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
            'x-api-key': '16db3318d1fb47d0822f65d62fc6f2a1'
        },
        data: payload
    };

    var all_promise = [];
    var number = -1;

    var limit = 10;
    var end = true;
    cursor = null;
    while (end) {
        all_promise = [];
        for (var i = 0; i < limit; i++) {


            payload = JSON.stringify({
                "query": "query($after: String, $first: Int, $filter: LogsFilterInputType)  {\r\n  logs(after: $after, first: $first, filter: $filter) {\r\n    pageInfo {\r\n      hasNextPage\r\n      hasPreviousPage\r\n      startCursor\r\n      endCursor\r\n    }\r\n    edges {\r\n      node {\r\n        toAddress\r\n        fromAddress\r\n        estimatedConfirmedAt\r\n      }\r\n    }\r\n  }\r\n}\r\n",
                "variables": {
                    "after": next,
                    "first": 50,
                    "filter": {

                        "typeIn": "MINT",
                        "contractAddress": {
                            "eq": contractAddress

                        }
                    }
                }
            });
            config = {
                method: 'post',
                url: 'https://graphql.icy.tools/graphql',
                headers: {
                    'authority': 'graphql.icy.tools',
                    'accept': '*/*',
                    'accept-language': 'en-US,en;q=0.9',
                    'content-type': 'application/json',
                    'origin': 'https://developers.icy.tools',
                    'referer': 'https://developers.icy.tools/',
                    'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"Windows"',
                    'sec-fetch-dest': 'empty',
                    'sec-fetch-mode': 'cors',
                    'sec-fetch-site': 'same-site',
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
                    'x-api-key': '16db3318d1fb47d0822f65d62fc6f2a1'
                },
                data: payload
            };
            let promise = getgraphqlrequest(config);
            all_promise.push(promise);
            number = number + 50;

            cursor = btoa(`arrayconnection:${number}`)
            next = cursor;
        }
        for (var item in all_promise) {
            // console.log(all_promise[item]);
            try {
                let result = await all_promise[item];

                // console.log(result);
                result.data.logs.edges.forEach(element => {
                    response.push(element.node);
                    all_tokens.push(element.node);
                })
                if (result.data.logs.pageInfo.hasNextPage == false) {
                    end = false;
                    break;
                }
            }
            catch (e) {

            }
        }


    }
    // while (true) {
    //     try {
    //         payload = JSON.stringify({
    //             "query": "query($after: String, $first: Int, $filter: LogsFilterInputType)  {\r\n  logs(after: $after, first: $first, filter: $filter) {\r\n    pageInfo {\r\n      hasNextPage\r\n      hasPreviousPage\r\n      startCursor\r\n      endCursor\r\n    }\r\n    edges {\r\n      node {\r\n        toAddress\r\n        fromAddress\r\n        estimatedConfirmedAt\r\n      }\r\n    }\r\n  }\r\n}\r\n",
    //             "variables": {
    //                 "after": next,
    //                 "first": 50,
    //                 "filter": {

    //                     "typeIn": "MINT",
    //                     "contractAddress": {
    //                         "eq": contractAddress

    //                     }
    //                 }
    //             }
    //         });
    //         config = {
    //             method: 'post',
    //             url: 'https://graphql.icy.tools/graphql',
    //             headers: {
    //                 'authority': 'graphql.icy.tools',
    //                 'accept': '*/*',
    //                 'accept-language': 'en-US,en;q=0.9',
    //                 'content-type': 'application/json',
    //                 'origin': 'https://developers.icy.tools',
    //                 'referer': 'https://developers.icy.tools/',
    //                 'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
    //                 'sec-ch-ua-mobile': '?0',
    //                 'sec-ch-ua-platform': '"Windows"',
    //                 'sec-fetch-dest': 'empty',
    //                 'sec-fetch-mode': 'cors',
    //                 'sec-fetch-site': 'same-site',
    //                 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
    //                 'x-api-key': '16db3318d1fb47d0822f65d62fc6f2a1'
    //             },
    //             data: payload
    //         };
    //         try {
    //             collectionData = (

    //                 await axios(config)
    //             ).data.data.logs;

    //         }
    //         catch (e) {
    //             console.log(e);
    //             continue;
    //         }
    //         // console.log('----------', collectionData);
    //         if (collectionData.pageInfo.hasNextPage == false) {
    //             collectionData = collectionData.edges;
    //             // console.log("Last one");

    //             collectionData.forEach((element, index) => {
    //                 response.push(element.node);
    //                 all_tokens.push(element.node);
    //             }

    //             )
    //             break;
    //         }
    //         else {
    //             next = collectionData.pageInfo.endCursor;
    //         }
    //         collectionData = collectionData.edges;
    //         collectionData.forEach((element, index) => {
    //             response.push(element.node);
    //             all_tokens.push(element.node);
    //         }

    //         )


    //         // for (let element of collectionData) {
    //         //     for (let tData of bundle.assets) {
    //         //         response.push({
    //         //             address: tData.owner.address,
    //         //             token_id: tData.token_id,
    //         //         });
    //         //     }
    //         // }
    //         index += 50;
    //         // await delay(300);
    //     } catch (err) {
    //         console.log("err", err);
    //         break;
    //     }
    // }
    let total_unique = 0;

    var seenNames = {};
    let array = response.filter(function (currentObject) {
        if (currentObject.toAddress in seenNames) {
            return false;
        } else {
            total_unique++;
            seenNames[currentObject.toAddress] = true;
            return true;
        }
    });

    let minter_distribution = [
        { 'count': 0, 'percentage': 0 },
        { 'count': 0, 'percentage': 0 },
        { 'count': 0, 'percentage': 0 },
        { 'count': 0, 'percentage': 0 },
        { 'count': 0, 'percentage': 0 },
        { 'count': 0, 'percentage': 0 }
    ];
    array.forEach((node) => node.cnt = 0)
    array.forEach(item => {
        for (var cnt = 0; cnt < response.length; cnt++) {
            if (item['toAddress'] == response[cnt]['toAddress']) {
                item['cnt']++;
            }
        }
    })

    array.map(item => {
        if (item['cnt'] == 1) {
            minter_distribution[0]['count']++;
        } else if (item['cnt'] <= 3 && item['cnt'] >= 2) {
            minter_distribution[1]['count']++;
        } else if (item['cnt'] <= 10 && item['cnt'] >= 4) {
            minter_distribution[2]['count']++;
        } else if (item['cnt'] <= 25 && item['cnt'] >= 11) {
            minter_distribution[3]['count']++;
        } else if (item['cnt'] <= 40 && item['cnt'] >= 26) {
            minter_distribution[4]['count']++;
        } else {
            minter_distribution[5]['count']++;
        }
    })
    minter_distribution.map(item => {
        item['percentage'] = (item['count'] / array.length * 100).toFixed(3) + "%";
    })


    var d = new Date();
    var d1 = new Date();
    var d2 = new Date();
    var d3 = new Date();
    var d4 = new Date();
    var d5 = new Date();
    // var d6 = new Date();
    // var d7 = new Date();

    d1.setDate(d1.getDate() - 1);
    d2.setDate(d2.getDate() - 2);
    d3.setDate(d3.getDate() - 3);
    d4.setDate(d4.getDate() - 4);
    d5.setDate(d5.getDate() - 5);
    // d6.setDate(d6.getDate() - 6);
    // d7.setDate(d7.getDate() - 7);




    var record_for_each_day = [
        { 'time': `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`, date: d.getDate(), month: d.getMonth() + 1, year: d.getFullYear(), 'mints': 0, 'unique': 0 },
        { 'time': `${d1.toLocaleString('default', { month: 'short' })} ${d1.getDate()}`, date: d1.getDate(), month: d1.getMonth() + 1, year: d.getFullYear(), 'mints': 0, 'unique': 0 },
        { 'time': `${d2.toLocaleString('default', { month: 'short' })} ${d2.getDate()}`, date: d2.getDate(), month: d2.getMonth() + 1, year: d.getFullYear(), 'mints': 0, 'unique': 0 },
        { 'time': `${d3.toLocaleString('default', { month: 'short' })} ${d3.getDate()}`, date: d3.getDate(), month: d3.getMonth() + 1, year: d.getFullYear(), 'mints': 0, 'unique': 0 },
        { 'time': `${d4.toLocaleString('default', { month: 'short' })} ${d4.getDate()}`, date: d4.getDate(), month: d4.getMonth() + 1, year: d.getFullYear(), 'mints': 0, 'unique': 0 },
        { 'time': `${d5.toLocaleString('default', { month: 'short' })} ${d5.getDate()}`, date: d5.getDate(), month: d5.getMonth() + 1, year: d.getFullYear(), 'mints': 0, 'unique': 0 },
        // { 'day': `${d6.toLocaleString('default', { month: 'short' })} ${d6.getDate()}`, year: d.getFullYear(), 'total_holders': 0, 'unique_holders': 0 },
        // { 'day': `${d7.toLocaleString('default', { month: 'short' })} ${d7.getDate()}`, year: d.getFullYear(), 'total_holders': 0, 'unique_holders': 0 }
    ];
    console.log(record_for_each_day);

    record_for_each_day.forEach((item, index) => {

        // all_tokens.filter((elemet) => { return true });
        // console.log(`${new Date(page1.time).toLocaleString('default', { month: 'short' })} ${new Date(page1.time).getDate()}`, item.day);


        let items = all_tokens.filter((page1) => {
            if (!page1.estimatedConfirmedAt)
                return false;
            // if (item.date > 19) {


            if (new Date(page1.estimatedConfirmedAt).getFullYear() < item.year) {
                return true;
            }
            else if ((new Date(page1.estimatedConfirmedAt).getMonth() + 1) < item.month) {
                return true;
            }
            else if (new Date(page1.estimatedConfirmedAt).getDate() <= item.date) {
                return true;
            }
            return false;
            console.log(new Date(page1.estimatedConfirmedAt).getFullYear() <= item.year && (new Date(page1.estimatedConfirmedAt).getMonth() + 1) <= item.month && new Date(page1.estimatedConfirmedAt).getDate() <= item.date);

            // }



            // return new Date(page1.estimatedConfirmedAt).getFullYear() <= item.year && (new Date(page1.estimatedConfirmedAt).getMonth() + 1) <= item.month && new Date(page1.estimatedConfirmedAt).getDate() <= item.date
        })
        let unique = 0;
        var seenNames = {};
        let array = items.filter(function (currentObject) {
            if (currentObject.toAddress in seenNames) {
                return false;
            } else {
                unique++;
                seenNames[currentObject.toAddress] = true;
                return true;
            }
        });
        seenNames = {};

        let total_minters = items.filter(function (currentObject) {
            if (currentObject.toAddress in seenNames) {
                return false;
            } else {

                return true;
            }
        });
        // console.log(items.length);
        if (index == 0) {
            record_for_each_day[index].unique = unique;
            record_for_each_day[index].mints = total_minters.length;
        }
        record_for_each_day[index].unique = unique;
        record_for_each_day[index].mints = total_minters.length;

    })

    // console.log(all_tokens);
    //console.log(record_for_each_day);

    let top_minters = [];
    const count = [];

    all_tokens.forEach(element => {
        var chek = count.find(c => c.address === element.toAddress);
        if (chek) {
            chek.count = chek.count + 1;
        }
        else {
            count.push({
                address: element.toAddress,
                count: 1

            }
            )
        }



    });
    //  👇️ { one: 3, two: 2, three: 1 }
    // console.log(count);
    var topValues = count.sort((a, b) => b.count - a.count).slice(0, 7);
    // console.log(topValues);


    return { "unique_minters": total_unique, "topValues": topValues, "total_minters": all_tokens.length, "minter_distribution": minter_distribution, "minter_distrubution_by_day": record_for_each_day };

}

const getgraphqlrequest = async (config) => {
    try {
        const { data } = await axios(config)
        return data;
    }
    catch (e) {
        console.log(e);
    }
    return {};
}
const getHolderInfoByTime = async (contractAddress, from, to) => {
    const nowTime = new Date(from);
    const prevTime = new Date(to);

    const result = [];

    var query = "DELETE FROM holder";
    sql.query(query, function (err, result) {
        if (err) throw err;
        console.log("All records has been deleted");
    });

    const response = [];
    for (var timeCnt = nowTime.getTime(); timeCnt < prevTime.getTime(); timeCnt += 86400000) {
        const holderInfo = (await axios.get(`https://api.opensea.io/api/v1/events?asset_contract_address=${contractAddress}&occurred_before=${formatDate(new Date(timeCnt + 86400000))}&occurred_after=${formatDate(new Date(timeCnt))}&event_type=successful`, options)).data

        holderInfo.asset_events.map(item => {
            response.push({
                address: item.asset.owner.address,
                token_id: item.asset.token_id
            })
        })

        console.log(response);
        var seenNames = {};
        array = response.filter(function (currentObject) {
            if (currentObject.address in seenNames) {
                return false;
            } else {
                seenNames[currentObject.address] = true;
                return true;
            }
        });
        array.forEach((node) => node.cnt = 0)
        array.forEach(item => {
            for (var cnt = 0; cnt < response.length; cnt++) {
                if (item['address'] == response[cnt]['address']) {
                    item['cnt']++;
                }
            }
        })
        record = [
            { 'count': 0, 'percentage': 0 },
            { 'count': 0, 'percentage': 0 },
            { 'count': 0, 'percentage': 0 },
            { 'count': 0, 'percentage': 0 }
        ];
        array.map(item => {
            if (item['cnt'] == 1) {
                record[0]['count']++;
            } else if (item['cnt'] <= 3 && item['cnt'] >= 2) {
                record[1]['count']++;
            } else if (item['cnt'] <= 7 && item['cnt'] >= 4) {
                record[2]['count']++;
            } else if (item['cnt'] <= 46 && item['cnt'] >= 7) {
                record[3]['count']++;
            }
        })
        record.map(item => {
            item['percentage'] = (item['count'] / array.length * 100).toFixed(3) + "%";
        })
        sql.query(`INSERT INTO holder (ExDate, data) VALUES ('${formatDate(new Date(timeCnt))}', '${record}')`, function (err) {
            if (err) throw err;
            console.log("1 record inserted");
        });
        result.push({
            ExDate: formatDate(new Date(timeCnt)),
            data: record
        })
    }
    return result;
}
const getFloorPrice = async (contractAddress) => {
    const collectionStats = (await axios.get(`https://api.opensea.io/api/v1/collection/${contractAddress}`, options)).data;
    console.log(collectionStats.collection.stats.floor_price);
    const result = { "floor_price": collectionStats.collection.stats.floor_price };
    return result;
}

const getSupply = async (contractAddress) => {
    var payload = JSON.stringify({
        "query": "query Contract($address: String!) {\r\n  contract(address: $address) {\r\n    ... on ERC721Contract {\r\n      circulatingSupply\r\n      attributes {\r\n        rarity\r\n      name\r\n        value\r\n        valueCount\r\n      }\r\n      name\r\n      stats {\r\n        average\r\n        ceiling\r\n        floor\r\n        totalSales\r\n        volume\r\n      }\r\n      unsafeOpenseaSlug\r\n      unsafeOpenseaExternalUrl\r\n      unsafeOpenseaImageUrl\r\n      unsafeOpenseaDescription\r\n      unsafeOpenseaBannerImageUrl\r\n      symbol\r\n    }\r\n  }\r\n}",
        "variables": {
            "address": contractAddress
        },
        "operationName": "Contract"
    });

    var config = {
        method: 'post',
        url: 'https://graphql.icy.tools/graphql',
        headers: {
            'authority': 'graphql.icy.tools',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'content-type': 'application/json',
            'origin': 'https://developers.icy.tools',
            'referer': 'https://developers.icy.tools/',
            'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
            'x-api-key': '16db3318d1fb47d0822f65d62fc6f2a1'
        },
        data: payload
    };

    let { data } = await axios(config);
    return data.data.contract.circulatingSupply;

}
const getCollectionInfo = async (contractAddress) => {
    // this.client = new Client();
    // await this.client.init({
    //     type: "preset",
    //     preset: "chrome83",
    // });
    // const slug = (await getCollectionSlug(contractAddress)).slug;

    var options = {
        method: 'POST',
        url: 'https://opensea.io/__api/graphql/',
        headers: [
            ['authority', 'opensea.io'],
            ['accept', '*/*'],
            ['accept-language', 'en-US,en;q=0.9'],
            ['content-type', 'application/json'],
            ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; dpr=0.800000011920929; csrftoken=zrEy6gN4jXToBSvkTGYZxsvWS0tDje2w; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; assets_card_variant=%22compact%22; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1oemYw:KIdkLpXBbuIeHITm0WDUB95Z6wgTfnIi42tRCZ0nvMk; _ga_9VSBF2K4BX=GS1.1.1664669393.54.1.1664669430.0.0.0; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1geb0ec48.1geb0fd6u.1ne.oc.2fq; __cf_bm=5QxcJnACbZwKCAaPjxhxOmwpWSda6nWnERToNe1mrJY-1664713686-0-ASf3efldPpzlcPQ07ZY3apr6r2Yrvyh/4vOVlcQizPuV/DSDIiYMiRPrU6j1I9N/IEresMbHtGWLNO1dGVmf/pE=; _dd_s=rum=0&expire=1664715460615; __os_session=eyJpZCI6IjljZDVlM2MyLTgwZjctNGZjOS1iMWNiLWRlNzM1YTI3OGE3MSJ9; __os_session.sig=xe-jJFNcBCnYHYQJ2pUg3OI0M2VYzbrtdtJaMHuizjo'],
            ['origin', 'https://opensea.io'],
            ['referer', 'https://opensea.io/'],
            ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
            ['sec-ch-ua-mobile', '?0'],
            ['sec-ch-ua-platform', '"Windows"'],
            ['sec-fetch-dest', 'empty'],
            ['sec-fetch-mode', 'cors'],
            ['sec-fetch-site', 'same-origin'],
            ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
            ['x-app-id', 'opensea-web'],
            ['x-build-id', '286e5afacb573a5459f372a8ad715981c70db8b5'],
            ['x-signed-query', '6a221e47ee626f5e4374f940a2b3701005710c34d14bfc563872baf230c920eb']
        ],
        body: JSON.stringify({
            "id": "NavSearchCollectionsQuery",
            "query": "query NavSearchCollectionsQuery(\n  $query: String!\n) {\n  searchCollections(first: 4, query: $query) {\n    edges {\n      node {\n        imageUrl\n        isVerified\n        name\n        relayId\n        statsV2 {\n          totalSupply\n          floorPrice {\n            unit\n            symbol\n          }\n        }\n        defaultChain {\n          identifier\n        }\n        drop {\n          ctaStage {\n            startTime\n            endTime\n            id\n          }\n          id\n        }\n        ...collection_url\n        ...useRecentViews_data\n        id\n      }\n    }\n  }\n}\n\nfragment collection_url on CollectionType {\n  slug\n  isCategory\n}\n\nfragment useRecentViews_data on CollectionType {\n  relayId\n  slug\n  imageUrl\n  isVerified\n  name\n  statsV2 {\n    totalSupply\n  }\n  defaultChain {\n    identifier\n  }\n  ...collection_url\n}\n",
            "variables": {
                "query": contractAddress
            }
        })
    };
    // let info = await getOSinfo(options).data.searchCollections.edges[0].node;
    // var payload = JSON.stringify({
    //     "query": "query Contract($address: String!) {\r\n  contract(address: $address) {\r\n    ... on ERC721Contract {\r\n      circulatingSupply\r\n      attributes {\r\n        rarity\r\n      name\r\n        value\r\n        valueCount\r\n      }\r\n      name\r\n      stats {\r\n        average\r\n        ceiling\r\n        floor\r\n        totalSales\r\n        volume\r\n      }\r\n      unsafeOpenseaSlug\r\n      unsafeOpenseaExternalUrl\r\n      unsafeOpenseaImageUrl\r\n      unsafeOpenseaDescription\r\n      unsafeOpenseaBannerImageUrl\r\n      symbol\r\n    }\r\n  }\r\n}",
    //     "variables": {
    //         "address": contractAddress
    //     },
    //     "operationName": "Contract"
    // });

    // var config = {
    //     method: 'post',
    //     url: 'https://graphql.icy.tools/graphql',
    //     headers: {
    //         'authority': 'graphql.icy.tools',
    //         'accept': '*/*',
    //         'accept-language': 'en-US,en;q=0.9',
    //         'content-type': 'application/json',
    //         'origin': 'https://developers.icy.tools',
    //         'referer': 'https://developers.icy.tools/',
    //         'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
    //         'sec-ch-ua-mobile': '?0',
    //         'sec-ch-ua-platform': '"Windows"',
    //         'sec-fetch-dest': 'empty',
    //         'sec-fetch-mode': 'cors',
    //         'sec-fetch-site': 'same-site',
    //         'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
    //         'x-api-key': '16db3318d1fb47d0822f65d62fc6f2a1'
    //     },
    //     data: payload
    // };
    var payload = JSON.stringify({
        "query": "query Collection($address: String) {\n  collection(address: $address) {\n    address\n    attributes {\n      count\n      displayType\n      name\n      value\n    }\n    circulatingSupply\n    createdAt\n    description\n    discordUrl\n    externalUrl\n    imageUrl\n    instagramUsername\n    name\n    slug\n    symbol\n    telegramUrl\n    totalSupply\n    twitterUsername\n    uuid\n    sellerRoyaltyBasisPoints\n    buyerRoyaltyBasisPoints\n    icySlug\n    isPromoted\n\n    dailyStats {\n      averagePriceInEth\n      maxPriceInEth\n      minPriceInEth\n      numberOfSales\n      volumeInEth\n    }\n  }\n}\n",
        "variables": {
            "address": contractAddress,
            // "icySlug": "icySlug"
        },
        "operationName": "Collection"
    });

    var config = {
        method: 'post',
        url: 'https://api.icy.tools/graphql',
        headers: {
            'authority': 'api.icy.tools',
            'accept': '*/*',
            'accept-language': 'en-US,en;q=0.9',
            'apollographql-client-name': 'icy.tools Web Client',
            'apollographql-client-version': '4c896ab716826b10f984907f0e7278e9544251ad',
            'content-type': 'application/json',
            'cookie': 'rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX18yrO%2FqPKty7A00i13Ns%2FG44e7RkIuq%2BIg%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX1%2BfOfb2x3Olc1CBGUnsvqNoRp%2F7MDWjDGU%3D; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHg4OTRmYWNkOWVjZmMyNjEwZWNjZWYzYTdlMDZjM2E3NmNkNjVmODQ1IiwiaWF0IjoxNjYzNzMxNjgxLCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.uKJVOEfB-eL3NcrExVhTXjxjLVafpWzLpBOja5mmJfE; _ga=GA1.1.1410678362.1663870692; icy-developers-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiOTI3YTZhM2MtYWQwZC00YzZmLTgwZjktZDgyYzczMmUwYWY4IiwiaWF0IjoxNjYzOTMyNDM2LCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.OL1zT8nwfZRpUVCTuFPgnXzutfwv7aL2ZIg9dUQWSoY; __cuid=ce5619f6812a488daaf2335a0acfe135; amp_fef1e8=15510d01-4004-403d-a9ee-579852315704R...1geel4p34.1geel4ts6.p.7.10; _ga_PFQM97KPDB=GS1.1.1664791720.6.1.1664791771.0.0.0; __cf_bm=fn7ektVAPoQMB.38n4k9BsQWyTaA_N_VcfV2g9uKdqg-1664792765-0-AWjqYehAVTOe+s9ImedWCSabE17fmzKQCJaePpBm3rgj37yjTB9KhuowHZVcMfU3xNpLkMebiZbasnJqSOoe8R+wfQAAMbUHeX8Ih01NEBmbGfy5tooGXgBnkgWI5sBclw==; _ga_7212E7ZCBS=GS1.1.1664791724.41.1.1664792931.0.0.0; mp_606dec7de8837f2e0819631c0a3066da_mixpanel=%7B%22distinct_id%22%3A%20%2218398adcabe456-070ddaf983962-26021c51-100200-18398adcabf58b%22%2C%22%24device_id%22%3A%20%2218398adcabe456-070ddaf983962-26021c51-100200-18398adcabf58b%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; mp_e950e8f150e2e3d7c790b0ca38b641af_mixpanel=%7B%22distinct_id%22%3A%20%2218398adccbd3e6-06fdcca3f23b7a-26021c51-100200-18398adccbe474%22%2C%22%24device_id%22%3A%20%2218398adccbd3e6-06fdcca3f23b7a-26021c51-100200-18398adccbe474%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; rl_user_id=RudderEncrypt%3AU2FsdGVkX18zc9JeVejdFZeurddEOK7WsMsGHC3ihNyty%2BVShuTq%2FjhnE78s0lEF3eyXSXDsmM%2FLImTyWEReqw%3D%3D; rl_trait=RudderEncrypt%3AU2FsdGVkX1%2BS1Yd%2FYusRJEBh17F%2B2vETFviEPYWNRtg%3D; rl_group_id=RudderEncrypt%3AU2FsdGVkX19cPHlAT3q2Iz3%2Bjptu1OobjY0y%2BMsJxPM%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX18ru0IrunLI2sGbs%2BoBHyQcPTpJK9EkUPI%3D; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX19TfxRFpYUnDWvh73UrAt7rmlp3VJZkldM2skmRgyRqzEQTnMv9a0eS3pb6h7LL4iBEYM6N%2B%2BNFHQ%3D%3D',
            'origin': 'https://icy.tools',
            'referer': 'https://icy.tools/',
            'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-site',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
            'x-security-token': '255d0f6c-a3f2-4718-83c6-262d49faead0',
            'x-api-key': '5d4c7e03f8594ccea5553094f1244949'
        },
        data: payload
    };


    let { data } = await axios(config);
    // console.log(data);

    // console.log(res);
    let twitter_username = "";
    let discord = "";
    let followers_count = "";
    let total_volume = "";
    let floor_price = "";

    const result = {
        "collectionInfo": {
            floor_price: floor_price,
            total_volume: total_volume,
            followers_count: followers_count,
            discord_url: data.data.collection.discordUrl,
            name: data.data.collection.name,
            image_url: data.data.collection.imageUrl,
            total_supply: data.data.collection.circulatingSupply,
            description: data.data.collection.description,
            slug: data.data.collection.slug,
            twitter_username: data.data.collection.twitterUsername,
            external_url: data.data.collection.externalUrl,
            symbol: data.data.collection.symbol,
            supply: data.data.collection.circulatingSupply,
            royalty: data.data.collection.sellerRoyaltyBasisPoints / 100
        }
    };
    return result;
}

const getCollectionSlug = async (contractAddress) => {
    // {

    //     // url: `https://opensea.io/collection/${slug}`,
    //     // method: "GET",
    //     method: 'GET',
    //         url: `https://opensea.io/collection/${data.data.contract.unsafeOpenseaSlug}`,
    //             headers: [
    //                 ['authority', 'opensea.io'],
    //                 ['accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9'],
    //                 ['accept-language', 'en-US,en;q=0.9'],
    //                 ['cache-control', 'max-age=0'],
    //                 // ['cookie': '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; __cf_bm=l_c2wqPzEte6yaTcfMmSfvc4ERfdgmpZNYCX_PdirB0-1664363610-0-ARZ2NQ2xyIptSkogoe9CXVMRqh39YUNh/kcthSpZQ/PM+pyvuIDWtFsKLDHDzw9RTlfSDn5z9Q9VrBBlN42pt7s=; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odV0j:tE1-8iETuSvmaIEORD54m9nUQAWXQNEj4xyPEswM_G8; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; _ga_9VSBF2K4BX=GS1.1.1664363629.36.1.1664363635.0.0.0; _ga=GA1.1.1039742238.1660027005; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge1sr0ob.1ge1sr9e7.53.5c.af; _dd_s=rum=0&expire=1664364954788; __cf_bm=3Cj7s7Cgl1k76TtVxktGaJJI_puPQUjTdTHe5rGalXY-1664364339-0-AYU3GYARiKysuzXzqQALLVDwUzyVJlmYHZlm8rSkoJVkCucaA4rEjpShaltEEMgSvh7/lGsYvuXSCuJQq/1wjAQ=; __os_session=eyJpZCI6IjljZDVlM2MyLTgwZjctNGZjOS1iMWNiLWRlNzM1YTI3OGE3MSJ9; __os_session.sig=xe-jJFNcBCnYHYQJ2pUg3OI0M2VYzbrtdtJaMHuizjo',
    //                 ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
    //                 ['sec-ch-ua-mobile', '?0'],
    //                 ['sec-ch-ua-platform', '"Windows"'],
    //                 ['sec-fetch-dest', 'document'],
    //                 ['sec-fetch-mode', 'navigate'],
    //                 ['sec-fetch-site', 'same-origin'],
    //                 ['sec-fetch-user', '?1'],
    //                 ['upgrade-insecure-requests', '1'],
    //                 ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36']
    //             ]
    // }
    var options = {
        url: `https://opensea.io/__api/graphql/`,
        method: "POST",
        headers: [
            ['authority', 'opensea.io'],
            ['accept', '*/*'],
            ['accept-language', 'en-US,en;q=0.9'],
            ['content-type', 'application/json'],
            // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
            ['origin', 'https://opensea.io'],
            ['referer', 'https://opensea.io/'],
            //['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
            ['sec-ch-ua-mobile', '?0'],
            ['sec-ch-ua-platform', '"Windows"'],
            ['sec-fetch-dest', 'empty'],
            ['sec-fetch-mode', 'cors'],
            ['sec-fetch-site', 'same-origin'],
            //['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
            ['x-app-id', 'opensea-web'],
            ['x-build-id', 'af2a3f21c162f8953f49c49349206b52e4b71667'],
            ['x-signed-query', 'dc212a3e42833aa98a090bf576bd8966928927b5b746082ad1c1eb96933f6e9a']

        ],
        // headers: [
        //     ['authority', 'opensea.io'],
        //     ['accept', '*/*'],
        //     ['accept-language', 'en-US,en;q=0.9'],
        //     ['content-type', 'application/json'],
        //     // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
        //     ['origin', 'https://opensea.io'],
        //     ['referer', 'https://opensea.io/'],
        //     ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
        //     ['sec-ch-ua-mobile', '?0'],
        //     ['sec-ch-ua-platform', '"Windows"'],
        //     ['sec-fetch-dest', 'empty'],
        //     ['sec-fetch-mode', 'cors'],
        //     ['sec-fetch-site', 'same-origin'],
        //     ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
        //     ['x-app-id', 'opensea-web'],
        //     ['x-build-id', 'af2a3f21c162f8953f49c49349206b52e4b71667'],
        //     ['x-signed-query', 'dc212a3e42833aa98a090bf576bd8966928927b5b746082ad1c1eb96933f6e9a']

        // ],

        "body": JSON.stringify({
            "id": "NavSearchCollectionsQuery",
            "query": "query NavSearchCollectionsQuery(\n  $query: String!\n) {\n  searchCollections(first: 4, query: $query) {\n    edges {\n      node {\n        imageUrl\n        isVerified\n        name\n        relayId\n        statsV2 {\n         totalSupply\n          floorPrice {\n            unit\n            symbol\n          }\n        }\n        defaultChain {\n          identifier\n        }\n        drop {\n          ctaStage {\n            startTime\n            endTime\n            id\n          }\n          id\n        }\n        ...collection_url\n        ...useRecentViews_data\n        id\n      }\n    }\n  }\n}\n\nfragment collection_url on CollectionType {\n  slug\n  isCategory\n}\n\nfragment useRecentViews_data on CollectionType {\n  relayId\n  slug\n  imageUrl\n  isVerified\n  name\n  statsV2 {\n    totalSupply\n  }\n  defaultChain {\n    identifier\n  }\n  ...collection_url\n}\n",
            "variables": {
                "query": contractAddress
            }
        })
    }


    var options1 = {
        method: 'POST',
        url: 'https://opensea.io/__api/graphql/',
        headers: [
            // ['authority', 'opensea.io'],
            // ['accept', '*/*'],
            // ['accept-language', 'en-US,en;q=0.9'],
            // ['content-type', 'application/json'],
            // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; dpr=0.800000011920929; csrftoken=zrEy6gN4jXToBSvkTGYZxsvWS0tDje2w; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; assets_card_variant=%22compact%22; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1oemYw:KIdkLpXBbuIeHITm0WDUB95Z6wgTfnIi42tRCZ0nvMk; _ga_9VSBF2K4BX=GS1.1.1664669393.54.1.1664669430.0.0.0; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1geb0ec48.1geb0fd6u.1ne.oc.2fq; __cf_bm=5QxcJnACbZwKCAaPjxhxOmwpWSda6nWnERToNe1mrJY-1664713686-0-ASf3efldPpzlcPQ07ZY3apr6r2Yrvyh/4vOVlcQizPuV/DSDIiYMiRPrU6j1I9N/IEresMbHtGWLNO1dGVmf/pE=; _dd_s=rum=0&expire=1664715460615; __os_session=eyJpZCI6IjljZDVlM2MyLTgwZjctNGZjOS1iMWNiLWRlNzM1YTI3OGE3MSJ9; __os_session.sig=xe-jJFNcBCnYHYQJ2pUg3OI0M2VYzbrtdtJaMHuizjo'],
            // ['origin', 'https://opensea.io'],
            // ['referer', 'https://opensea.io/'],
            // ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
            // ['sec-ch-ua-mobile', '?0'],
            // ['sec-ch-ua-platform', '"Windows"'],
            // ['sec-fetch-dest', 'empty'],
            // ['sec-fetch-mode', 'cors'],
            // ['sec-fetch-site', 'same-origin'],
            // ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
            // ['x-app-id', 'opensea-web'],
            // ['x-build-id', '286e5afacb573a5459f372a8ad715981c70db8b5'],
            // ['x-signed-query', '6a221e47ee626f5e4374f940a2b3701005710c34d14bfc563872baf230c920eb']
            // ['authority', 'opensea.io'],
            // ['accept', '*/*'],
            // ['accept-language', 'en-US,en;q=0.9'],
            // ['content-type', 'application/json'],
            // // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
            // ['origin', 'https://opensea.io'],
            // ['referer', 'https://opensea.io/'],
            // ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
            // ['sec-ch-ua-mobile', '?0'],
            // ['sec-ch-ua-platform', '"Windows"'],
            // ['sec-fetch-dest', 'empty'],
            // ['sec-fetch-mode', 'cors'],
            // ['sec-fetch-site', 'same-origin'],
            // ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
            // ['x-app-id', 'opensea-web'],
            // ['x-build-id', '286e5afacb573a5459f372a8ad715981c70db8b5'],
            // ['x-signed-query', '6a221e47ee626f5e4374f940a2b3701005710c34d14bfc563872baf230c920eb']
            // ['authority', 'opensea.io'],
            // ['accept', '*/*'],
            // ['accept-language', 'en-US,en;q=0.9'],
            // ['content-type', 'application/json'],
            // ['cookie', '__cf_bm=yKX9rdI5R13tnKa8.UPn.WvUgxOVmKU7Mkp5N9woxYc-1664716537-0-AcnTg/CalLO2H2yLO3zWUQyATQpKz8pmXUgjDxhZ7e6sKBysHS3FtF7t7TMx7Wu5iHvN40g/BdamCn9uku1fb90=; csrftoken=T4VVT5R750ygRN8vI0iQP8riWKwXQjvs; sessionid=eyJzZXNzaW9uSWQiOiI4Y2NmYzkwNi1lZWJhLTRjMjMtODhkYS02ZmMwZTA2OGE4YzMifQ:1oeyov:Zf4gJJdm3SvfyHdtfxSvi20ej00HI90vKpwj_IHRQJ8; _gcl_au=1.1.475354913.1664716551; ajs_anonymous_id=e71f9271-83da-4c93-8589-1bb3fcfa5474; amp_ddd6ec=nYFr7Y3uckzFmwmNf2hn_K...1gecddcpa.1gecddk2l.1.1.2; _gid=GA1.2.214067707.1664716561; _ga=GA1.1.1111135845.1664716561; _uetsid=5c88ec00425411ed9c4fdfa82905bacd; _uetvid=5c89b590425411ed945af5b0116b1eb2; _ga_9VSBF2K4BX=GS1.1.1664716560.1.0.1664716614.0.0.0; _dd_s=rum=1&id=41f936ef-e5b0-4250-b1ed-b4029aadfc27&created=1664716550992&expire=1664717544213; __os_session=eyJpZCI6IjljZDVlM2MyLTgwZjctNGZjOS1iMWNiLWRlNzM1YTI3OGE3MSJ9; __os_session.sig=xe-jJFNcBCnYHYQJ2pUg3OI0M2VYzbrtdtJaMHuizjo'],

            // ['origin', 'https://opensea.io'],
            // ['referer', 'https://opensea.io/'],
            // ['sec-ch-ua', '"Google Chrome";v="105", "Not A;Brand";v="8", "Chromium";v="105"'],
            // ['sec-ch-ua-mobile', '?0'],
            // ['sec-ch-ua-platform', '"Windows"'],
            // ['sec-fetch-dest', 'empty'],
            // ['sec-fetch-mode', 'cors'],
            // ['sec-fetch-site', 'same-origin'],
            // ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
            // ['x-app-id', 'opensea-web'],
            // ['x-build-id', '286e5afacb573a5459f372a8ad715981c70db8b5'],
            // ['x-datadog-origin', 'rum'],
            // ['x-datadog-parent-id', '6627092457232495367'],
            // ['x-datadog-sampling-priority', '1'],
            // ['x-datadog-trace-id', '4625187046534233937'],
            // ['x-signed-query', '6a221e47ee626f5e4374f940a2b3701005710c34d14bfc563872baf230c920eb']

            ['authority', 'opensea.io'],
            ['accept', '*/*'],
            ['accept-language', 'en-US,en;q=0.9'],
            ['content-type', 'application/json'],
            //['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; dpr=0.800000011920929; assets_card_variant=%22compact%22; csrftoken=Rm7IniOBwGvpHcRCQa55WTIrLbwAhxrN; __cf_bm=8GCc7PeWZWNetobMW5818MvM7rmRRBZwQpYXjgD9nfM-1664800259-0-Aal0klWI1IxsX2NHkFA+PnnIFFKv/1l6nh52RZJ5AcgqiFQjvtTaC0Y817jy9I+67Fs0FCHGX81bmH5xM2wCbeQ=; _ga_9VSBF2K4BX=GS1.1.1664800306.62.1.1664800320.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; mp_606dec7de8837f2e0819631c0a3066da_mixpanel=%7B%22distinct_id%22%3A%20%2218398c256673a-088cce685e9027-26021c51-100200-18398c25668379%22%2C%22%24device_id%22%3A%20%2218398c256673a-088cce685e9027-26021c51-100200-18398c25668379%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; mp_e950e8f150e2e3d7c790b0ca38b641af_mixpanel=%7B%22distinct_id%22%3A%20%2218398c25c3828-06f842ee8a7455-26021c51-100200-18398c25c3926a%22%2C%22%24device_id%22%3A%20%2218398c25c3828-06f842ee8a7455-26021c51-100200-18398c25c3926a%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1geet9mn5.1geetboeq.1oa.p6.2hg; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1ofKd6:6UwVhRMgkInmmHKTil-PGMraVy_sqAhxY_X4qD_WzqA; _dd_s=rum=0&expire=1664801284863'],
            ['origin', 'https://opensea.io'],

            ['referer', 'https://opensea.io/'],
            //['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
            ['sec-ch-ua-mobile', '?0'],
            //['sec-ch-ua-platform', '"Windows"'],
            ['sec-fetch-dest', 'empty'],
            ['sec-fetch-mode', 'cors'],
            ['sec-fetch-site', 'same-origin'],
            //['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],

            ['x-app-id', 'opensea-web'],
            ['x-build-id', '286e5afacb573a5459f372a8ad715981c70db8b5'],
            ['x-signed-query', '6a221e47ee626f5e4374f940a2b3701005710c34d14bfc563872baf230c920eb']
        ],
        body: JSON.stringify({
            "id": "NavSearchCollectionsQuery",

            "query": "query NavSearchCollectionsQuery(\n  $query: String!\n) {\n  searchCollections(first: 4, query: $query) {\n    edges {\n      node {\n        imageUrl\n        isVerified\n        name\n        relayId\n        statsV2 {\n          totalSupply\n          floorPrice {\n            unit\n            symbol\n          }\n        }\n        defaultChain {\n          identifier\n        }\n        drop {\n          ctaStage {\n            startTime\n            endTime\n            id\n          }\n          id\n        }\n        ...collection_url\n        ...useRecentViews_data\n        id\n      }\n    }\n  }\n}\n\nfragment collection_url on CollectionType {\n  slug\n  isCategory\n}\n\nfragment useRecentViews_data on CollectionType {\n  relayId\n  slug\n  imageUrl\n  isVerified\n  name\n  statsV2 {\n    totalSupply\n  }\n  defaultChain {\n    identifier\n  }\n  ...collection_url\n}\n",
            "variables": {
                "query": `${contractAddress}`
            }
        })
    };
    // const collectionInfo = (await axios.get(`https://api.opensea.io/api/v1/asset_contract/${contractAddress}`, options)).data;
    // const result = { "slug": collectionInfo.collection.slug };
    // return result;

    //console.log(res);
    // console.log(JSON.parse(res.body).data.searchCollections.edges[0].node.slug);
    try {
        let res = await getOSinfo(options1);
        let slug = JSON.parse(res.body).data.searchCollections.edges[0].node.slug;
        return { "slug": slug };
    } catch {

        let res = await getCollInfoTS(contractAddress);
        //console.log(res)
        let slug = JSON.parse(res.body).projects[0].nft_name_slug;
        return { "slug": slug };

    }
}


const getOSinfo = async (config) => {
    this.client = new Client();

    var randomNumber = Math.floor(Math.random() * presetArray.length);
    config.headers.push(['user-agent', presetArray[randomNumber].ua])


    await this.client.init({
        type: "preset",
        preset: presetArray[randomNumber].preset,
    });
    let res = await this.client.request(config);

    //console.log(res)

    return res;

}



const getIcySearch = async (collectionAddress) => {


    var randomNumber = Math.floor(Math.random() * presetArray.length);

    await this.client.init({
        type: "preset",
        preset: presetArray[randomNumber].preset,
    });


    var options = {
        url: `https://api.icy.tools/_legacy/search?q=${collectionAddress}`,
        method: "GET",
        headers: [
            //['authority', 'opensea.io'],
            ['accept', '*/*'],
            ['accept-language', 'en-US,en;q=0.9'],
            //['content-type', 'application/json'],
            // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
            //['origin', 'https://opensea.io'],
            //['referer', 'https://opensea.io/'],
            //['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
            ['sec-ch-ua-mobile', '?0'],
            //['sec-ch-ua-platform', '"Windows"'],
            ['sec-fetch-dest', 'empty'],
            ['sec-fetch-mode', 'cors'],
            ['sec-fetch-site', 'same-origin'],
            //['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
            //['x-app-id', 'opensea-web'],
            //['x-build-id', 'af2a3f21c162f8953f49c49349206b52e4b71667'],
            //['x-signed-query', 'dc212a3e42833aa98a090bf576bd8966928927b5b746082ad1c1eb96933f6e9a']

        ],
    }

    options.headers.push(['user-agent', presetArray[randomNumber].ua])


    let res = await this.client.request(options);
    console.log(res)

    return JSON.parse(res.body)

}




const getCollInfoTS = async (collectionAddress) => {


    this.client = new Client();

    var randomNumber = Math.floor(Math.random() * presetArray.length);


    await this.client.init({
        type: "preset",
        preset: presetArray[randomNumber].preset,
    });


    var options = {
        url: `https://api.traitsniper.com/api/projects?page=0&limit=5&name=${collectionAddress}`,
        method: "GET",
        headers: [
            //['authority', 'opensea.io'],
            ['accept', '*/*'],
            ['accept-language', 'en-US,en;q=0.9'],
            //['content-type', 'application/json'],
            // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
            //['origin', 'https://opensea.io'],
            //['referer', 'https://opensea.io/'],
            //['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
            ['sec-ch-ua-mobile', '?0'],
            //['sec-ch-ua-platform', '"Windows"'],
            ['sec-fetch-dest', 'empty'],
            ['sec-fetch-mode', 'cors'],
            ['sec-fetch-site', 'same-origin'],
            //['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
            //['x-app-id', 'opensea-web'],
            //['x-build-id', 'af2a3f21c162f8953f49c49349206b52e4b71667'],
            //['x-signed-query', 'dc212a3e42833aa98a090bf576bd8966928927b5b746082ad1c1eb96933f6e9a']

        ],
        // headers: [
        //     ['authority', 'opensea.io'],
        //     ['accept', '*/*'],
        //     ['accept-language', 'en-US,en;q=0.9'],
        //     ['content-type', 'application/json'],
        //     // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
        //     ['origin', 'https://opensea.io'],
        //     ['referer', 'https://opensea.io/'],
        //     ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
        //     ['sec-ch-ua-mobile', '?0'],
        //     ['sec-ch-ua-platform', '"Windows"'],
        //     ['sec-fetch-dest', 'empty'],
        //     ['sec-fetch-mode', 'cors'],
        //     ['sec-fetch-site', 'same-origin'],
        //     ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
        //     ['x-app-id', 'opensea-web'],
        //     ['x-build-id', 'af2a3f21c162f8953f49c49349206b52e4b71667'],
        //     ['x-signed-query', 'dc212a3e42833aa98a090bf576bd8966928927b5b746082ad1c1eb96933f6e9a']

        // ],

        // "body": JSON.stringify({
        //     "id": "NavSearchCollectionsQuery",
        //     "query": "query NavSearchCollectionsQuery(\n  $query: String!\n) {\n  searchCollections(first: 4, query: $query) {\n    edges {\n      node {\n        imageUrl\n        isVerified\n        name\n        relayId\n        statsV2 {\n         totalSupply\n          floorPrice {\n            unit\n            symbol\n          }\n        }\n        defaultChain {\n          identifier\n        }\n        drop {\n          ctaStage {\n            startTime\n            endTime\n            id\n          }\n          id\n        }\n        ...collection_url\n        ...useRecentViews_data\n        id\n      }\n    }\n  }\n}\n\nfragment collection_url on CollectionType {\n  slug\n  isCategory\n}\n\nfragment useRecentViews_data on CollectionType {\n  relayId\n  slug\n  imageUrl\n  isVerified\n  name\n  statsV2 {\n    totalSupply\n  }\n  defaultChain {\n    identifier\n  }\n  ...collection_url\n}\n",
        //     "variables": {
        //         "query": contractAddress
        //     }
        // })
    }

    options.headers.push(['user-agent', presetArray[randomNumber].ua])


    let res = await this.client.request(options);

    return res;

    //     fetch("https://api.traitsniper.com/api/projects?page=0&limit=5&name=0x92324a569fa793485b44da60b6663a8cb8fc49a9", {
    //   "headers": {
    //     "accept": "*/*",
    //     "accept-language": "en-US,en;q=0.9",
    //     "cache-control": "no-cache",
    //     "pragma": "no-cache",
    //     "sec-ch-ua": "\"Not-A.Brand\";v=\"99\", \"Opera GX\";v=\"91\", \"Chromium\";v=\"105\"",
    //     "sec-ch-ua-mobile": "?0",
    //     "sec-ch-ua-platform": "\"Windows\"",
    //     "sec-fetch-dest": "empty",
    //     "sec-fetch-mode": "cors",
    //     "sec-fetch-site": "same-site"
    //   },
    //   "referrer": "https://app.traitsniper.com/",
    //   "referrerPolicy": "strict-origin-when-cross-origin",
    //   "body": null,
    //   "method": "GET",
    //   "mode": "cors",
    //   "credentials": "omit"
    // });


}


const getStats = async (contractAddress) => {
    var options1 = {
        method: 'POST',
        url: 'https://opensea.io/__api/graphql/',
        headers: [
            ['authority', 'opensea.io'],
            ['accept', '*/*'],
            ['accept-language', 'en-US,en;q=0.9'],
            ['content-type', 'application/json'],
            ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; dpr=0.800000011920929; assets_card_variant=%22compact%22; csrftoken=Rm7IniOBwGvpHcRCQa55WTIrLbwAhxrN; __cf_bm=8GCc7PeWZWNetobMW5818MvM7rmRRBZwQpYXjgD9nfM-1664800259-0-Aal0klWI1IxsX2NHkFA+PnnIFFKv/1l6nh52RZJ5AcgqiFQjvtTaC0Y817jy9I+67Fs0FCHGX81bmH5xM2wCbeQ=; _ga_9VSBF2K4BX=GS1.1.1664800306.62.1.1664800320.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; mp_606dec7de8837f2e0819631c0a3066da_mixpanel=%7B%22distinct_id%22%3A%20%2218398c256673a-088cce685e9027-26021c51-100200-18398c25668379%22%2C%22%24device_id%22%3A%20%2218398c256673a-088cce685e9027-26021c51-100200-18398c25668379%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; mp_e950e8f150e2e3d7c790b0ca38b641af_mixpanel=%7B%22distinct_id%22%3A%20%2218398c25c3828-06f842ee8a7455-26021c51-100200-18398c25c3926a%22%2C%22%24device_id%22%3A%20%2218398c25c3828-06f842ee8a7455-26021c51-100200-18398c25c3926a%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1geet9mn5.1geetboeq.1oa.p6.2hg; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1ofKd6:6UwVhRMgkInmmHKTil-PGMraVy_sqAhxY_X4qD_WzqA; _dd_s=rum=0&expire=1664801284863'],
            ['origin', 'https://opensea.io'],
            ['referer', 'https://opensea.io/'],
            ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
            ['sec-ch-ua-mobile', '?0'],
            ['sec-ch-ua-platform', '"Windows"'],
            ['sec-fetch-dest', 'empty'],
            ['sec-fetch-mode', 'cors'],
            ['sec-fetch-site', 'same-origin'],
            ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
            ['x-app-id', 'opensea-web'],
            ['x-build-id', '217c254dfca3449b2ab96ee9868df549d14925a3'],
            ['x-signed-query', '1b065a99225177ac4985094318e05fdd11ded2e0b8d2231073b60e6a1d671302']
        ],
        body: JSON.stringify({
            "id": "CollectionPageQuery",
            "query": "query CollectionPageQuery(\n  $collection: CollectionSlug!\n  $collections: [CollectionSlug!]\n  $numericTraits: [TraitRangeType!]\n  $query: String\n  $sortAscending: Boolean\n  $sortBy: SearchSortBy\n  $stringTraits: [TraitInputType!]\n  $toggles: [SearchToggle!]\n  $resultModel: SearchResultModel\n  $showContextMenu: Boolean!\n  $prioritizeBuyNow: Boolean\n) {\n  collection(collection: $collection) {\n    isCollectionOffersEnabled\n    verificationStatus\n    enabledRarities\n    ...CollectionPageHead_collection\n    ...CollectionPageLayout_collection\n    id\n  }\n  ...AssetSearchCollectionView_data_2ZxBTm\n}\n\nfragment AccountLink_data on AccountType {\n  address\n  config\n  isCompromised\n  user {\n    publicUsername\n    id\n  }\n  displayName\n  ...ProfileImage_data\n  ...wallet_accountKey\n  ...accounts_url\n}\n\nfragment AssetAddToCartButton_order on OrderV2Type {\n  maker {\n    address\n    id\n  }\n  item {\n    __typename\n    ...itemEvents_data\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  ...ShoppingCartContextProvider_inline_order\n}\n\nfragment AssetCardBuyNow_data on AssetType {\n  tokenId\n  relayId\n  assetContract {\n    address\n    chain\n    id\n  }\n  orderData {\n    bestAskV2 {\n      relayId\n      priceType {\n        usd\n      }\n      id\n    }\n  }\n}\n\nfragment AssetContextMenu_data on AssetType {\n  ...asset_edit_url\n  ...asset_url\n  ...itemEvents_data\n  relayId\n  isDelisted\n  creator {\n    address\n    id\n  }\n  imageUrl\n}\n\nfragment AssetMediaAnimation_asset on AssetType {\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaAudio_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaContainer_asset_2V84VL on AssetType {\n  backgroundColor\n  ...AssetMediaEditions_asset_2V84VL\n}\n\nfragment AssetMediaEditions_asset_2V84VL on AssetType {\n  decimals\n}\n\nfragment AssetMediaImage_asset on AssetType {\n  backgroundColor\n  imageUrl\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaPlaceholderImage_asset on AssetType {\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaVideo_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaWebgl_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMedia_asset on AssetType {\n  animationUrl\n  displayImageUrl\n  imageUrl\n  isDelisted\n  ...AssetMediaAnimation_asset\n  ...AssetMediaAudio_asset\n  ...AssetMediaContainer_asset_2V84VL\n  ...AssetMediaImage_asset\n  ...AssetMediaPlaceholderImage_asset\n  ...AssetMediaVideo_asset\n  ...AssetMediaWebgl_asset\n}\n\nfragment AssetMedia_asset_2V84VL on AssetType {\n  animationUrl\n  displayImageUrl\n  imageUrl\n  isDelisted\n  ...AssetMediaAnimation_asset\n  ...AssetMediaAudio_asset\n  ...AssetMediaContainer_asset_2V84VL\n  ...AssetMediaImage_asset\n  ...AssetMediaPlaceholderImage_asset\n  ...AssetMediaVideo_asset\n  ...AssetMediaWebgl_asset\n}\n\nfragment AssetQuantity_data on AssetQuantityType {\n  asset {\n    ...Price_data\n    id\n  }\n  quantity\n}\n\nfragment AssetSearchCollectionView_data_2ZxBTm on Query {\n  ...AssetSearchSortDropdown_data\n  ...AssetSearchCollection_data_2ZxBTm\n}\n\nfragment AssetSearchCollection_data_2ZxBTm on Query {\n  queriedAt\n  ...AssetSearchFilter_data_PFx8Z\n  ...PhoenixSearchPills_data_2Kg4Sq\n  search: collectionItems(collections: $collections, first: 20, numericTraits: $numericTraits, resultType: $resultModel, querystring: $query, sortAscending: $sortAscending, sortBy: $sortBy, stringTraits: $stringTraits, toggles: $toggles, prioritizeBuyNow: $prioritizeBuyNow) {\n    edges {\n      node {\n        __typename\n        relayId\n        ...AssetSearchList_data_27d9G3\n        ... on Node {\n          __isNode: __typename\n          id\n        }\n      }\n      cursor\n    }\n    totalCount\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment AssetSearchFilter_data_PFx8Z on Query {\n  collection(collection: $collection) {\n    numericTraits {\n      key\n      value {\n        max\n        min\n      }\n      ...NumericTraitFilter_data\n    }\n    stringTraits {\n      key\n      ...StringTraitFilter_data\n    }\n    defaultChain {\n      identifier\n    }\n    enabledRarities\n    ...RarityFilter_data\n    ...useIsRarityEnabled_collection\n    id\n  }\n  ...PaymentFilter_data_2YoIWt\n}\n\nfragment AssetSearchList_data_27d9G3 on ItemType {\n  __isItemType: __typename\n  __typename\n  relayId\n  ...ItemCard_data_1OrK6u\n  ... on AssetType {\n    collection {\n      isVerified\n      relayId\n      id\n    }\n    ...asset_url\n  }\n  ... on AssetBundleType {\n    bundleCollection: collection {\n      isVerified\n      relayId\n      id\n    }\n  }\n  chain {\n    identifier\n  }\n}\n\nfragment AssetSearchSortDropdown_data on Query {\n  collection(collection: $collection) {\n    ...useIsRarityEnabled_collection\n    id\n  }\n}\n\nfragment CollectionDescriptionMetadata_data on CollectionType {\n  statsV2 {\n    totalSupply\n  }\n  createdDate\n  totalCreatorFeeBasisPoints\n  defaultChain {\n    identifier\n  }\n}\n\nfragment CollectionLink_assetContract on AssetContractType {\n  address\n  blockExplorerLink\n}\n\nfragment CollectionLink_collection on CollectionType {\n  name\n  slug\n  verificationStatus\n  ...collection_url\n}\n\nfragment CollectionPageHead_collection on CollectionType {\n  name\n  description\n  slug\n  bannerImageUrl\n  owner {\n    address\n    displayName\n    id\n  }\n  ...collection_url\n}\n\nfragment CollectionPageLayout_collection on CollectionType {\n  slug\n  name\n  imageUrl\n  bannerImageUrl\n  verificationStatus\n  owner {\n    ...AccountLink_data\n    id\n  }\n  representativeAsset {\n    assetContract {\n      openseaVersion\n      id\n    }\n    id\n  }\n  ...PhoenixCollectionActionBar_data\n  ...PhoenixCollectionInfo_data\n  ...PhoenixCollectionSocialBar_data\n}\n\nfragment CollectionWatchlistButton_data on CollectionType {\n  relayId\n}\n\nfragment ItemCardAnnotations_27d9G3 on ItemType {\n  __isItemType: __typename\n  relayId\n  __typename\n  ... on AssetType {\n    chain {\n      identifier\n    }\n    decimals\n    favoritesCount\n    isDelisted\n    isFrozen\n    hasUnlockableContent\n    ...AssetCardBuyNow_data\n    orderData {\n      bestAskV2 {\n        ...AssetAddToCartButton_order\n        orderType\n        maker {\n          address\n          id\n        }\n        id\n      }\n    }\n    ...AssetContextMenu_data @include(if: $showContextMenu)\n  }\n  ... on AssetBundleType {\n    assetCount\n  }\n}\n\nfragment ItemCardContent_2V84VL on ItemType {\n  __isItemType: __typename\n  __typename\n  ... on AssetType {\n    relayId\n    name\n    ...AssetMedia_asset_2V84VL\n  }\n  ... on AssetBundleType {\n    assetQuantities(first: 18) {\n      edges {\n        node {\n          asset {\n            relayId\n            ...AssetMedia_asset\n            id\n          }\n          id\n        }\n      }\n    }\n  }\n}\n\nfragment ItemCardFooter_27d9G3 on ItemType {\n  __isItemType: __typename\n  name\n  orderData {\n    bestBidV2 {\n      orderType\n      priceType {\n        unit\n      }\n      ...PriceContainer_data\n      id\n    }\n    bestAskV2 {\n      orderType\n      priceType {\n        unit\n      }\n      maker {\n        address\n        id\n      }\n      ...PriceContainer_data\n      id\n    }\n  }\n  ...ItemMetadata\n  ...ItemCardAnnotations_27d9G3\n  ... on AssetType {\n    tokenId\n    isDelisted\n    defaultRarityData {\n      ...RarityIndicator_data\n      id\n    }\n    collection {\n      slug\n      name\n      isVerified\n      ...collection_url\n      ...useIsRarityEnabled_collection\n      id\n    }\n  }\n  ... on AssetBundleType {\n    bundleCollection: collection {\n      slug\n      name\n      isVerified\n      ...collection_url\n      ...useIsRarityEnabled_collection\n      id\n    }\n  }\n}\n\nfragment ItemCard_data_1OrK6u on ItemType {\n  __isItemType: __typename\n  __typename\n  relayId\n  orderData {\n    bestAskV2 {\n      priceType {\n        eth\n      }\n      id\n    }\n  }\n  ...ItemCardContent_2V84VL\n  ...ItemCardFooter_27d9G3\n  ...item_url\n  ... on AssetType {\n    isDelisted\n    ...itemEvents_data\n  }\n}\n\nfragment ItemMetadata on ItemType {\n  __isItemType: __typename\n  __typename\n  orderData {\n    bestAskV2 {\n      closedAt\n      id\n    }\n  }\n  assetEventData {\n    lastSale {\n      unitPriceQuantity {\n        ...AssetQuantity_data\n        id\n      }\n    }\n  }\n}\n\nfragment NumericTraitFilter_data on NumericTraitTypePair {\n  key\n  value {\n    max\n    min\n  }\n}\n\nfragment OrderListItem_order on OrderV2Type {\n  relayId\n  item {\n    __typename\n    ... on AssetType {\n      __typename\n      displayName\n      assetContract {\n        ...CollectionLink_assetContract\n        id\n      }\n      collection {\n        slug\n        verificationStatus\n        ...CollectionLink_collection\n        id\n      }\n      ...AssetMedia_asset\n      ...asset_url\n      ...useAssetFees_asset\n    }\n    ... on AssetBundleType {\n      __typename\n    }\n    ...itemEvents_data\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  remainingQuantityType\n  ...OrderPrice\n}\n\nfragment OrderList_orders on OrderV2Type {\n  item {\n    __typename\n    relayId\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  relayId\n  ...OrderListItem_order\n}\n\nfragment OrderPrice on OrderV2Type {\n  priceType {\n    unit\n  }\n  perUnitPriceType {\n    unit\n  }\n  dutchAuctionFinalPriceType {\n    unit\n  }\n  openedAt\n  closedAt\n  payment {\n    ...TokenPricePayment\n    id\n  }\n}\n\nfragment PaymentAssetLogo_data on PaymentAssetType {\n  chain {\n    identifier\n  }\n  symbol\n  asset {\n    imageUrl\n    id\n  }\n}\n\nfragment PaymentFilter_data_2YoIWt on Query {\n  paymentAssets(first: 10) {\n    edges {\n      node {\n        symbol\n        id\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n  PaymentFilter_collection: collection(collection: $collection) {\n    paymentAssets {\n      symbol\n      id\n    }\n    id\n  }\n}\n\nfragment PhoenixCollectionActionBar_data on CollectionType {\n  relayId\n  assetContracts(first: 2) {\n    edges {\n      node {\n        address\n        blockExplorerLink\n        chain\n        chainData {\n          blockExplorer {\n            name\n            identifier\n          }\n        }\n        id\n      }\n    }\n  }\n  discordUrl\n  externalUrl\n  instagramUsername\n  mediumUsername\n  telegramUrl\n  twitterUsername\n  connectedTwitterUsername\n  ...collection_url\n  ...CollectionWatchlistButton_data\n}\n\nfragment PhoenixCollectionInfo_data on CollectionType {\n  isCollectionOffersEnabled\n  description\n  name\n  nativePaymentAsset {\n    ...PaymentAssetLogo_data\n    id\n  }\n  ...collection_url\n  ...collection_stats\n  ...CollectionDescriptionMetadata_data\n}\n\nfragment PhoenixCollectionSocialBar_data on CollectionType {\n  assetContracts(first: 2) {\n    edges {\n      node {\n        address\n        blockExplorerLink\n        chain\n        chainData {\n          blockExplorer {\n            name\n            identifier\n          }\n        }\n        id\n      }\n    }\n  }\n  discordUrl\n  externalUrl\n  instagramUsername\n  mediumUsername\n  telegramUrl\n  twitterUsername\n  connectedTwitterUsername\n  connectedInstagramUsername\n  ...collection_url\n}\n\nfragment PhoenixSearchPills_data_2Kg4Sq on Query {\n  selectedCollections: collections(first: 25, collections: $collections, includeHidden: true) {\n    edges {\n      node {\n        imageUrl\n        name\n        slug\n        id\n      }\n    }\n  }\n}\n\nfragment PriceContainer_data on OrderV2Type {\n  ...OrderPrice\n}\n\nfragment Price_data on AssetType {\n  decimals\n  imageUrl\n  symbol\n  usdSpotPrice\n  assetContract {\n    blockExplorerLink\n    chain\n    id\n  }\n}\n\nfragment ProfileImage_data on AccountType {\n  imageUrl\n}\n\nfragment RarityFilter_data on CollectionType {\n  representativeRarityData {\n    maxRank\n    id\n  }\n}\n\nfragment RarityIndicator_data on RarityDataType {\n  rank\n  rankPercentile\n  rankCount\n  maxRank\n}\n\nfragment ShoppingCartContextProvider_inline_order on OrderV2Type {\n  relayId\n  item {\n    __typename\n    chain {\n      identifier\n    }\n    relayId\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  payment {\n    relayId\n    id\n  }\n  remainingQuantityType\n  ...ShoppingCart_orders\n}\n\nfragment ShoppingCartDetailedView_orders on OrderV2Type {\n  relayId\n  item {\n    __typename\n    chain {\n      identifier\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  supportsGiftingOnPurchase\n  ...useTotalPrice_orders\n  ...OrderList_orders\n}\n\nfragment ShoppingCartFooter_orders on OrderV2Type {\n  ...useTotalPrice_orders\n}\n\nfragment ShoppingCart_orders on OrderV2Type {\n  relayId\n  item {\n    __typename\n    relayId\n    chain {\n      identifier\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  payment {\n    relayId\n    symbol\n    id\n  }\n  ...ShoppingCartDetailedView_orders\n  ...ShoppingCartFooter_orders\n  ...useTotalPrice_orders\n}\n\nfragment StringTraitFilter_data on StringTraitType {\n  counts {\n    count\n    value\n  }\n  key\n}\n\nfragment TokenPricePayment on PaymentAssetType {\n  symbol\n  chain {\n    identifier\n  }\n  asset {\n    imageUrl\n    assetContract {\n      blockExplorerLink\n      id\n    }\n    id\n  }\n}\n\nfragment accounts_url on AccountType {\n  address\n  user {\n    publicUsername\n    id\n  }\n}\n\nfragment asset_edit_url on AssetType {\n  assetContract {\n    address\n    chain\n    id\n  }\n  tokenId\n  collection {\n    slug\n    id\n  }\n}\n\nfragment asset_url on AssetType {\n  assetContract {\n    address\n    id\n  }\n  tokenId\n  chain {\n    identifier\n  }\n}\n\nfragment bundle_url on AssetBundleType {\n  slug\n  chain {\n    identifier\n  }\n}\n\nfragment collection_stats on CollectionType {\n  statsV2 {\n    totalListed\n    numOwners\n    totalQuantity\n    totalSupply\n    totalVolume {\n      unit\n    }\n    floorPrice {\n      unit\n    }\n  }\n  collectionOffers(first: 1) {\n    edges {\n      node {\n        priceType {\n          eth\n        }\n        id\n      }\n    }\n  }\n}\n\nfragment collection_url on CollectionType {\n  slug\n  isCategory\n}\n\nfragment itemEvents_data on AssetType {\n  relayId\n  assetContract {\n    address\n    id\n  }\n  tokenId\n  chain {\n    identifier\n  }\n}\n\nfragment item_url on ItemType {\n  __isItemType: __typename\n  __typename\n  ... on AssetType {\n    ...asset_url\n  }\n  ... on AssetBundleType {\n    ...bundle_url\n  }\n}\n\nfragment useAssetFees_asset on AssetType {\n  openseaSellerFeeBasisPoints\n  totalCreatorFee\n}\n\nfragment useIsRarityEnabled_collection on CollectionType {\n  slug\n  enabledRarities\n  isEligibleForRarity\n}\n\nfragment useTotalPrice_orders on OrderV2Type {\n  relayId\n  perUnitPriceType {\n    usd\n    unit\n  }\n  dutchAuctionFinalPriceType {\n    usd\n    unit\n  }\n  openedAt\n  closedAt\n  payment {\n    symbol\n    ...TokenPricePayment\n    id\n  }\n}\n\nfragment wallet_accountKey on AccountType {\n  address\n}\n",
            "variables": {
                "collection": "lana-del-taco",
                "collections": [
                    "lana-del-taco"
                ],
                "collectionQuery": null,
                "includeHiddenCollections": null,
                "numericTraits": null,
                "query": null,
                "sortAscending": true,
                "sortBy": "UNIT_PRICE",
                "stringTraits": null,
                "toggles": null,
                "resultModel": "ASSETS",
                "showContextMenu": false,
                "includeCollectionFilter": false,
                "prioritizeBuyNow": true
            }
        })
    };

    // const collectionInfo = (await axios.get(`https://api.opensea.io/api/v1/asset_contract/${contractAddress}`, options)).data;
    // const result = { "slug": collectionInfo.collection.slug };
    // return result;
    let res = await getOSinfo(options1);
    let collection = JSON.parse(res.body).data.collection;
    let stat = collection.statsV2;

    // console.log(stat);
    return {
        "total_listed": stat.totalListed,
        "floor_price": stat.floorPrice.unit,
        "total_volume": stat.totalVolume.unit,
        "total_listed": stat.totalListed,
        "total_supply": stat.totalSupply,
    };

}

const getStats1 = async (contractAddress) => {
    try {
        let slug = (await getCollectionSlug(contractAddress)).slug;
        var payload = JSON.stringify({
            "operationName": "CollectionDailyStats",
            "variables": {
                "address": contractAddress,
                "filter": {
                    "interval": "ONE_HOUR"
                }
            },
            "query": "query CollectionDailyStats($address: String!, $filter: CollectionOHLCVFilterInput) {\n  collection(address: $address) {\n    address\n    dailyStats {\n      averagePriceInEth\n      maxPriceInEth\n      minPriceInEth\n      numberOfSales\n      volumeInEth\n      previousStats {\n        averagePriceInEth\n        maxPriceInEth\n        minPriceInEth\n        numberOfSales\n        volumeInEth\n        __typename\n      }\n      __typename\n    }\n    ohlcv(filter: $filter) {\n      average\n      close\n      count\n      high\n      low\n      open\n      volume\n      timestamp\n      __typename\n    }\n    __typename\n  }\n}"
        });

        var config = {
            method: 'post',
            url: 'https://api.icy.tools/graphql',
            headers: {
                'authority': 'api.icy.tools',
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'apollographql-client-name': 'icy.tools Web Client',
                'apollographql-client-version': '650526aa9a14f2e4782f432ae4412256a3f82863',
                'content-type': 'application/json',
                'cookie': 'rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX18yrO%2FqPKty7A00i13Ns%2FG44e7RkIuq%2BIg%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX1%2BfOfb2x3Olc1CBGUnsvqNoRp%2F7MDWjDGU%3D; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHg4OTRmYWNkOWVjZmMyNjEwZWNjZWYzYTdlMDZjM2E3NmNkNjVmODQ1IiwiaWF0IjoxNjYzNzMxNjgxLCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.uKJVOEfB-eL3NcrExVhTXjxjLVafpWzLpBOja5mmJfE; _ga=GA1.1.1410678362.1663870692; icy-developers-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiOTI3YTZhM2MtYWQwZC00YzZmLTgwZjktZDgyYzczMmUwYWY4IiwiaWF0IjoxNjYzOTMyNDM2LCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.OL1zT8nwfZRpUVCTuFPgnXzutfwv7aL2ZIg9dUQWSoY; _ga_7212E7ZCBS=GS1.1.1664823472.43.0.1664823473.0.0.0; rl_user_id=RudderEncrypt%3AU2FsdGVkX19BtNo4bXZd0f8rttEid3F7SqBJo4YQQgjZzuEr%2F0ii%2FKRgGDU3KEbsm%2BMZTcZ0Os9brmFWkBZ9UQ%3D%3D; rl_trait=RudderEncrypt%3AU2FsdGVkX186EEOcZaY5C5IqXbararPDX2vTfWGAy2w%3D; rl_group_id=RudderEncrypt%3AU2FsdGVkX1%2FQ%2BTThqy1ApLvokm6vTqhBvGxm5rTNH5s%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX19h2cTF1IuCK%2B3%2FHAfkc9A0c2wgzyAH3mY%3D; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX18ss4IeqGAYHQ20Hahl0uFOaSRuDEhDs88hp292WGYkOLxFK023GRpbAtaPjLQP4NW171GyBILqCQ%3D%3D; __cuid=ce5619f6812a488daaf2335a0acfe135; amp_fef1e8=15510d01-4004-403d-a9ee-579852315704R...1gefnulrc.1gefnvd1a.s.7.13; _ga_PFQM97KPDB=GS1.1.1664831307.8.0.1664831307.0.0.0; mp_606dec7de8837f2e0819631c0a3066da_mixpanel=%7B%22distinct_id%22%3A%20%2218398adcabe456-070ddaf983962-26021c51-100200-18398adcabf58b%22%2C%22%24device_id%22%3A%20%2218398adcabe456-070ddaf983962-26021c51-100200-18398adcabf58b%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; mp_e950e8f150e2e3d7c790b0ca38b641af_mixpanel=%7B%22distinct_id%22%3A%20%2218398adccbd3e6-06fdcca3f23b7a-26021c51-100200-18398adccbe474%22%2C%22%24device_id%22%3A%20%2218398adccbd3e6-06fdcca3f23b7a-26021c51-100200-18398adccbe474%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; __cf_bm=KhnnTt.i7uaSJGBT.BdobKVk.HmubFuhblgRrY_fTn4-1664831314-0-AU10OTusK3eN0NX6swsdFi6Nb/wEnCDoZxzO2UstEq5noBAusaQbS1g9nri48mq4Z2W3y+CDPu2nIn26fozsY0Pz2DvBVxU6bqszeS6C2bUuxwpCkiY2IMvMGLj0+tEgkg==',
                'origin': 'https://icy.tools',
                'referer': 'https://icy.tools/',
                'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
                'x-security-token': '1c807fce-aac2-4aac-a36c-ca36bbdb09a6'
            },
            data: payload
        };

        const { data } = await axios(config);

        let os_stat = (await axios.get(`https://api.opensea.io/api/v1/collection/${slug}/stats`)).data;
        console.log(os_stat);
        let dailyStats = data.data.collection.dailyStats;

        var options1 = {
            method: 'POST',
            url: 'https://opensea.io/__api/graphql/',
            headers: [
                ['authority', 'opensea.io'],
                ['accept', '*/*'],
                ['accept-language', 'en-US,en;q=0.9'],
                ['content-type', 'application/json'],
                ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; dpr=0.800000011920929; assets_card_variant=%22compact%22; csrftoken=Rm7IniOBwGvpHcRCQa55WTIrLbwAhxrN; __cf_bm=8GCc7PeWZWNetobMW5818MvM7rmRRBZwQpYXjgD9nfM-1664800259-0-Aal0klWI1IxsX2NHkFA+PnnIFFKv/1l6nh52RZJ5AcgqiFQjvtTaC0Y817jy9I+67Fs0FCHGX81bmH5xM2wCbeQ=; _ga_9VSBF2K4BX=GS1.1.1664800306.62.1.1664800320.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; mp_606dec7de8837f2e0819631c0a3066da_mixpanel=%7B%22distinct_id%22%3A%20%2218398c256673a-088cce685e9027-26021c51-100200-18398c25668379%22%2C%22%24device_id%22%3A%20%2218398c256673a-088cce685e9027-26021c51-100200-18398c25668379%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; mp_e950e8f150e2e3d7c790b0ca38b641af_mixpanel=%7B%22distinct_id%22%3A%20%2218398c25c3828-06f842ee8a7455-26021c51-100200-18398c25c3926a%22%2C%22%24device_id%22%3A%20%2218398c25c3828-06f842ee8a7455-26021c51-100200-18398c25c3926a%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1geet9mn5.1geetboeq.1oa.p6.2hg; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1ofKd6:6UwVhRMgkInmmHKTil-PGMraVy_sqAhxY_X4qD_WzqA; _dd_s=rum=0&expire=1664801284863'],
                ['origin', 'https://opensea.io'],
                ['referer', 'https://opensea.io/'],
                ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
                ['sec-ch-ua-mobile', '?0'],
                ['sec-ch-ua-platform', '"Windows"'],
                ['sec-fetch-dest', 'empty'],
                ['sec-fetch-mode', 'cors'],
                ['sec-fetch-site', 'same-origin'],
                ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
                ['x-app-id', 'opensea-web'],
                ['x-build-id', '217c254dfca3449b2ab96ee9868df549d14925a3'],
                ['x-signed-query', '1b065a99225177ac4985094318e05fdd11ded2e0b8d2231073b60e6a1d671302']
            ],
            body: JSON.stringify({
                "id": "CollectionPageQuery",
                "query": "query CollectionPageQuery(\n  $collection: CollectionSlug!\n  $collections: [CollectionSlug!]\n  $numericTraits: [TraitRangeType!]\n  $query: String\n  $sortAscending: Boolean\n  $sortBy: SearchSortBy\n  $stringTraits: [TraitInputType!]\n  $toggles: [SearchToggle!]\n  $resultModel: SearchResultModel\n  $showContextMenu: Boolean!\n  $prioritizeBuyNow: Boolean\n) {\n  collection(collection: $collection) {\n    isCollectionOffersEnabled\n    verificationStatus\n    enabledRarities\n    ...CollectionPageHead_collection\n    ...CollectionPageLayout_collection\n    id\n  }\n  ...AssetSearchCollectionView_data_2ZxBTm\n}\n\nfragment AccountLink_data on AccountType {\n  address\n  config\n  isCompromised\n  user {\n    publicUsername\n    id\n  }\n  displayName\n  ...ProfileImage_data\n  ...wallet_accountKey\n  ...accounts_url\n}\n\nfragment AssetAddToCartButton_order on OrderV2Type {\n  maker {\n    address\n    id\n  }\n  item {\n    __typename\n    ...itemEvents_data\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  ...ShoppingCartContextProvider_inline_order\n}\n\nfragment AssetCardBuyNow_data on AssetType {\n  tokenId\n  relayId\n  assetContract {\n    address\n    chain\n    id\n  }\n  orderData {\n    bestAskV2 {\n      relayId\n      priceType {\n        usd\n      }\n      id\n    }\n  }\n}\n\nfragment AssetContextMenu_data on AssetType {\n  ...asset_edit_url\n  ...asset_url\n  ...itemEvents_data\n  relayId\n  isDelisted\n  creator {\n    address\n    id\n  }\n  imageUrl\n}\n\nfragment AssetMediaAnimation_asset on AssetType {\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaAudio_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaContainer_asset_2V84VL on AssetType {\n  backgroundColor\n  ...AssetMediaEditions_asset_2V84VL\n}\n\nfragment AssetMediaEditions_asset_2V84VL on AssetType {\n  decimals\n}\n\nfragment AssetMediaImage_asset on AssetType {\n  backgroundColor\n  imageUrl\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaPlaceholderImage_asset on AssetType {\n  collection {\n    displayData {\n      cardDisplayStyle\n    }\n    id\n  }\n}\n\nfragment AssetMediaVideo_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMediaWebgl_asset on AssetType {\n  backgroundColor\n  ...AssetMediaImage_asset\n}\n\nfragment AssetMedia_asset on AssetType {\n  animationUrl\n  displayImageUrl\n  imageUrl\n  isDelisted\n  ...AssetMediaAnimation_asset\n  ...AssetMediaAudio_asset\n  ...AssetMediaContainer_asset_2V84VL\n  ...AssetMediaImage_asset\n  ...AssetMediaPlaceholderImage_asset\n  ...AssetMediaVideo_asset\n  ...AssetMediaWebgl_asset\n}\n\nfragment AssetMedia_asset_2V84VL on AssetType {\n  animationUrl\n  displayImageUrl\n  imageUrl\n  isDelisted\n  ...AssetMediaAnimation_asset\n  ...AssetMediaAudio_asset\n  ...AssetMediaContainer_asset_2V84VL\n  ...AssetMediaImage_asset\n  ...AssetMediaPlaceholderImage_asset\n  ...AssetMediaVideo_asset\n  ...AssetMediaWebgl_asset\n}\n\nfragment AssetQuantity_data on AssetQuantityType {\n  asset {\n    ...Price_data\n    id\n  }\n  quantity\n}\n\nfragment AssetSearchCollectionView_data_2ZxBTm on Query {\n  ...AssetSearchSortDropdown_data\n  ...AssetSearchCollection_data_2ZxBTm\n}\n\nfragment AssetSearchCollection_data_2ZxBTm on Query {\n  queriedAt\n  ...AssetSearchFilter_data_PFx8Z\n  ...PhoenixSearchPills_data_2Kg4Sq\n  search: collectionItems(collections: $collections, first: 20, numericTraits: $numericTraits, resultType: $resultModel, querystring: $query, sortAscending: $sortAscending, sortBy: $sortBy, stringTraits: $stringTraits, toggles: $toggles, prioritizeBuyNow: $prioritizeBuyNow) {\n    edges {\n      node {\n        __typename\n        relayId\n        ...AssetSearchList_data_27d9G3\n        ... on Node {\n          __isNode: __typename\n          id\n        }\n      }\n      cursor\n    }\n    totalCount\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n}\n\nfragment AssetSearchFilter_data_PFx8Z on Query {\n  collection(collection: $collection) {\n    numericTraits {\n      key\n      value {\n        max\n        min\n      }\n      ...NumericTraitFilter_data\n    }\n    stringTraits {\n      key\n      ...StringTraitFilter_data\n    }\n    defaultChain {\n      identifier\n    }\n    enabledRarities\n    ...RarityFilter_data\n    ...useIsRarityEnabled_collection\n    id\n  }\n  ...PaymentFilter_data_2YoIWt\n}\n\nfragment AssetSearchList_data_27d9G3 on ItemType {\n  __isItemType: __typename\n  __typename\n  relayId\n  ...ItemCard_data_1OrK6u\n  ... on AssetType {\n    collection {\n      isVerified\n      relayId\n      id\n    }\n    ...asset_url\n  }\n  ... on AssetBundleType {\n    bundleCollection: collection {\n      isVerified\n      relayId\n      id\n    }\n  }\n  chain {\n    identifier\n  }\n}\n\nfragment AssetSearchSortDropdown_data on Query {\n  collection(collection: $collection) {\n    ...useIsRarityEnabled_collection\n    id\n  }\n}\n\nfragment CollectionDescriptionMetadata_data on CollectionType {\n  statsV2 {\n    totalSupply\n  }\n  createdDate\n  totalCreatorFeeBasisPoints\n  defaultChain {\n    identifier\n  }\n}\n\nfragment CollectionLink_assetContract on AssetContractType {\n  address\n  blockExplorerLink\n}\n\nfragment CollectionLink_collection on CollectionType {\n  name\n  slug\n  verificationStatus\n  ...collection_url\n}\n\nfragment CollectionPageHead_collection on CollectionType {\n  name\n  description\n  slug\n  bannerImageUrl\n  owner {\n    address\n    displayName\n    id\n  }\n  ...collection_url\n}\n\nfragment CollectionPageLayout_collection on CollectionType {\n  slug\n  name\n  imageUrl\n  bannerImageUrl\n  verificationStatus\n  owner {\n    ...AccountLink_data\n    id\n  }\n  representativeAsset {\n    assetContract {\n      openseaVersion\n      id\n    }\n    id\n  }\n  ...PhoenixCollectionActionBar_data\n  ...PhoenixCollectionInfo_data\n  ...PhoenixCollectionSocialBar_data\n}\n\nfragment CollectionWatchlistButton_data on CollectionType {\n  relayId\n}\n\nfragment ItemCardAnnotations_27d9G3 on ItemType {\n  __isItemType: __typename\n  relayId\n  __typename\n  ... on AssetType {\n    chain {\n      identifier\n    }\n    decimals\n    favoritesCount\n    isDelisted\n    isFrozen\n    hasUnlockableContent\n    ...AssetCardBuyNow_data\n    orderData {\n      bestAskV2 {\n        ...AssetAddToCartButton_order\n        orderType\n        maker {\n          address\n          id\n        }\n        id\n      }\n    }\n    ...AssetContextMenu_data @include(if: $showContextMenu)\n  }\n  ... on AssetBundleType {\n    assetCount\n  }\n}\n\nfragment ItemCardContent_2V84VL on ItemType {\n  __isItemType: __typename\n  __typename\n  ... on AssetType {\n    relayId\n    name\n    ...AssetMedia_asset_2V84VL\n  }\n  ... on AssetBundleType {\n    assetQuantities(first: 18) {\n      edges {\n        node {\n          asset {\n            relayId\n            ...AssetMedia_asset\n            id\n          }\n          id\n        }\n      }\n    }\n  }\n}\n\nfragment ItemCardFooter_27d9G3 on ItemType {\n  __isItemType: __typename\n  name\n  orderData {\n    bestBidV2 {\n      orderType\n      priceType {\n        unit\n      }\n      ...PriceContainer_data\n      id\n    }\n    bestAskV2 {\n      orderType\n      priceType {\n        unit\n      }\n      maker {\n        address\n        id\n      }\n      ...PriceContainer_data\n      id\n    }\n  }\n  ...ItemMetadata\n  ...ItemCardAnnotations_27d9G3\n  ... on AssetType {\n    tokenId\n    isDelisted\n    defaultRarityData {\n      ...RarityIndicator_data\n      id\n    }\n    collection {\n      slug\n      name\n      isVerified\n      ...collection_url\n      ...useIsRarityEnabled_collection\n      id\n    }\n  }\n  ... on AssetBundleType {\n    bundleCollection: collection {\n      slug\n      name\n      isVerified\n      ...collection_url\n      ...useIsRarityEnabled_collection\n      id\n    }\n  }\n}\n\nfragment ItemCard_data_1OrK6u on ItemType {\n  __isItemType: __typename\n  __typename\n  relayId\n  orderData {\n    bestAskV2 {\n      priceType {\n        eth\n      }\n      id\n    }\n  }\n  ...ItemCardContent_2V84VL\n  ...ItemCardFooter_27d9G3\n  ...item_url\n  ... on AssetType {\n    isDelisted\n    ...itemEvents_data\n  }\n}\n\nfragment ItemMetadata on ItemType {\n  __isItemType: __typename\n  __typename\n  orderData {\n    bestAskV2 {\n      closedAt\n      id\n    }\n  }\n  assetEventData {\n    lastSale {\n      unitPriceQuantity {\n        ...AssetQuantity_data\n        id\n      }\n    }\n  }\n}\n\nfragment NumericTraitFilter_data on NumericTraitTypePair {\n  key\n  value {\n    max\n    min\n  }\n}\n\nfragment OrderListItem_order on OrderV2Type {\n  relayId\n  item {\n    __typename\n    ... on AssetType {\n      __typename\n      displayName\n      assetContract {\n        ...CollectionLink_assetContract\n        id\n      }\n      collection {\n        slug\n        verificationStatus\n        ...CollectionLink_collection\n        id\n      }\n      ...AssetMedia_asset\n      ...asset_url\n      ...useAssetFees_asset\n    }\n    ... on AssetBundleType {\n      __typename\n    }\n    ...itemEvents_data\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  remainingQuantityType\n  ...OrderPrice\n}\n\nfragment OrderList_orders on OrderV2Type {\n  item {\n    __typename\n    relayId\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  relayId\n  ...OrderListItem_order\n}\n\nfragment OrderPrice on OrderV2Type {\n  priceType {\n    unit\n  }\n  perUnitPriceType {\n    unit\n  }\n  dutchAuctionFinalPriceType {\n    unit\n  }\n  openedAt\n  closedAt\n  payment {\n    ...TokenPricePayment\n    id\n  }\n}\n\nfragment PaymentAssetLogo_data on PaymentAssetType {\n  chain {\n    identifier\n  }\n  symbol\n  asset {\n    imageUrl\n    id\n  }\n}\n\nfragment PaymentFilter_data_2YoIWt on Query {\n  paymentAssets(first: 10) {\n    edges {\n      node {\n        symbol\n        id\n        __typename\n      }\n      cursor\n    }\n    pageInfo {\n      endCursor\n      hasNextPage\n    }\n  }\n  PaymentFilter_collection: collection(collection: $collection) {\n    paymentAssets {\n      symbol\n      id\n    }\n    id\n  }\n}\n\nfragment PhoenixCollectionActionBar_data on CollectionType {\n  relayId\n  assetContracts(first: 2) {\n    edges {\n      node {\n        address\n        blockExplorerLink\n        chain\n        chainData {\n          blockExplorer {\n            name\n            identifier\n          }\n        }\n        id\n      }\n    }\n  }\n  discordUrl\n  externalUrl\n  instagramUsername\n  mediumUsername\n  telegramUrl\n  twitterUsername\n  connectedTwitterUsername\n  ...collection_url\n  ...CollectionWatchlistButton_data\n}\n\nfragment PhoenixCollectionInfo_data on CollectionType {\n  isCollectionOffersEnabled\n  description\n  name\n  nativePaymentAsset {\n    ...PaymentAssetLogo_data\n    id\n  }\n  ...collection_url\n  ...collection_stats\n  ...CollectionDescriptionMetadata_data\n}\n\nfragment PhoenixCollectionSocialBar_data on CollectionType {\n  assetContracts(first: 2) {\n    edges {\n      node {\n        address\n        blockExplorerLink\n        chain\n        chainData {\n          blockExplorer {\n            name\n            identifier\n          }\n        }\n        id\n      }\n    }\n  }\n  discordUrl\n  externalUrl\n  instagramUsername\n  mediumUsername\n  telegramUrl\n  twitterUsername\n  connectedTwitterUsername\n  connectedInstagramUsername\n  ...collection_url\n}\n\nfragment PhoenixSearchPills_data_2Kg4Sq on Query {\n  selectedCollections: collections(first: 25, collections: $collections, includeHidden: true) {\n    edges {\n      node {\n        imageUrl\n        name\n        slug\n        id\n      }\n    }\n  }\n}\n\nfragment PriceContainer_data on OrderV2Type {\n  ...OrderPrice\n}\n\nfragment Price_data on AssetType {\n  decimals\n  imageUrl\n  symbol\n  usdSpotPrice\n  assetContract {\n    blockExplorerLink\n    chain\n    id\n  }\n}\n\nfragment ProfileImage_data on AccountType {\n  imageUrl\n}\n\nfragment RarityFilter_data on CollectionType {\n  representativeRarityData {\n    maxRank\n    id\n  }\n}\n\nfragment RarityIndicator_data on RarityDataType {\n  rank\n  rankPercentile\n  rankCount\n  maxRank\n}\n\nfragment ShoppingCartContextProvider_inline_order on OrderV2Type {\n  relayId\n  item {\n    __typename\n    chain {\n      identifier\n    }\n    relayId\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  payment {\n    relayId\n    id\n  }\n  remainingQuantityType\n  ...ShoppingCart_orders\n}\n\nfragment ShoppingCartDetailedView_orders on OrderV2Type {\n  relayId\n  item {\n    __typename\n    chain {\n      identifier\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  supportsGiftingOnPurchase\n  ...useTotalPrice_orders\n  ...OrderList_orders\n}\n\nfragment ShoppingCartFooter_orders on OrderV2Type {\n  ...useTotalPrice_orders\n}\n\nfragment ShoppingCart_orders on OrderV2Type {\n  relayId\n  item {\n    __typename\n    relayId\n    chain {\n      identifier\n    }\n    ... on Node {\n      __isNode: __typename\n      id\n    }\n  }\n  payment {\n    relayId\n    symbol\n    id\n  }\n  ...ShoppingCartDetailedView_orders\n  ...ShoppingCartFooter_orders\n  ...useTotalPrice_orders\n}\n\nfragment StringTraitFilter_data on StringTraitType {\n  counts {\n    count\n    value\n  }\n  key\n}\n\nfragment TokenPricePayment on PaymentAssetType {\n  symbol\n  chain {\n    identifier\n  }\n  asset {\n    imageUrl\n    assetContract {\n      blockExplorerLink\n      id\n    }\n    id\n  }\n}\n\nfragment accounts_url on AccountType {\n  address\n  user {\n    publicUsername\n    id\n  }\n}\n\nfragment asset_edit_url on AssetType {\n  assetContract {\n    address\n    chain\n    id\n  }\n  tokenId\n  collection {\n    slug\n    id\n  }\n}\n\nfragment asset_url on AssetType {\n  assetContract {\n    address\n    id\n  }\n  tokenId\n  chain {\n    identifier\n  }\n}\n\nfragment bundle_url on AssetBundleType {\n  slug\n  chain {\n    identifier\n  }\n}\n\nfragment collection_stats on CollectionType {\n  statsV2 {\n    totalListed\n    numOwners\n    totalQuantity\n    totalSupply\n    totalVolume {\n      unit\n    }\n    floorPrice {\n      unit\n    }\n  }\n  collectionOffers(first: 1) {\n    edges {\n      node {\n        priceType {\n          eth\n        }\n        id\n      }\n    }\n  }\n}\n\nfragment collection_url on CollectionType {\n  slug\n  isCategory\n}\n\nfragment itemEvents_data on AssetType {\n  relayId\n  assetContract {\n    address\n    id\n  }\n  tokenId\n  chain {\n    identifier\n  }\n}\n\nfragment item_url on ItemType {\n  __isItemType: __typename\n  __typename\n  ... on AssetType {\n    ...asset_url\n  }\n  ... on AssetBundleType {\n    ...bundle_url\n  }\n}\n\nfragment useAssetFees_asset on AssetType {\n  openseaSellerFeeBasisPoints\n  totalCreatorFee\n}\n\nfragment useIsRarityEnabled_collection on CollectionType {\n  slug\n  enabledRarities\n  isEligibleForRarity\n}\n\nfragment useTotalPrice_orders on OrderV2Type {\n  relayId\n  perUnitPriceType {\n    usd\n    unit\n  }\n  dutchAuctionFinalPriceType {\n    usd\n    unit\n  }\n  openedAt\n  closedAt\n  payment {\n    symbol\n    ...TokenPricePayment\n    id\n  }\n}\n\nfragment wallet_accountKey on AccountType {\n  address\n}\n",
                "variables": {
                    "collection": slug,
                    "collections": [
                        slug
                    ],
                    "collectionQuery": null,
                    "includeHiddenCollections": null,
                    "numericTraits": null,
                    "query": null,
                    "sortAscending": true,
                    "sortBy": "UNIT_PRICE",
                    "stringTraits": null,
                    "toggles": null,
                    "resultModel": "ASSETS",
                    "showContextMenu": false,
                    "includeCollectionFilter": false,
                    "prioritizeBuyNow": true
                }
            })
        };

        // const collectionInfo = (await axios.get(`https://api.opensea.io/api/v1/asset_contract/${contractAddress}`, options)).data;
        // const result = { "slug": collectionInfo.collection.slug };
        // return result;
        let res = await getOSinfo(options1);
        let collection = JSON.parse(res.body).data.collection;
        let stat = collection.statsV2;
        // console.log({
        //     "average_price": dailyStats.averagePriceInEth,
        //     "volume": dailyStats.volumeInEth,
        //     "sales": dailyStats.numberOfSales,
        //     "total_volume": stat.totalVolume.unit,
        //     "total_listed": stat.totalListed,
        //     "total_supply": stat.totalSupply,
        //     "floor_price": stat.floorPrice.unit,
        //     "previous": {
        //         "sales": dailyStats.previousStats.numberOfSales,
        //         "volume": dailyStats.previousStats.volumeInEth
        //     },
        //     "volume_change": ((dailyStats.volumeInEth - dailyStats.previousStats.volumeInEth) / dailyStats.volumeInEth * 100).toFixed(2),
        //     "sales_change": ((dailyStats.numberOfSales - dailyStats.previousStats.numberOfSales) / dailyStats.numberOfSales * 100).toFixed(2),


        // });
        return {
            "average_price": dailyStats.averagePriceInEth,
            "volume": dailyStats.volumeInEth,
            "sales": dailyStats.numberOfSales,
            "total_volume": stat.totalVolume.unit,
            "total_listed": stat.totalListed,
            "total_supply": stat.totalSupply,
            "floor_price": stat.floorPrice.unit,
            "previous": {
                "sales": dailyStats.previousStats.numberOfSales,
                "volume": dailyStats.previousStats.volumeInEth
            },
            "volume_change": ((dailyStats.volumeInEth - dailyStats.previousStats.volumeInEth) / dailyStats.volumeInEth * 100).toFixed(2),
            "sales_change": ((dailyStats.numberOfSales - dailyStats.previousStats.numberOfSales) / dailyStats.numberOfSales * 100).toFixed(2)


        }
    }
    catch (e) {
        console.log(e);
    }
}
const getCollectionName = async (contractAddress) => {
    const collectionInfo = (await axios.get(`https://api.opensea.io/api/v1/asset_contract/${contractAddress}`, options)).data;
    const result = { "name": collectionInfo.collection.name };
    return result;
}

const getAssetInfo = async (contractAddress, tokenId) => {
    console.log('df')

    const assetInfo = (await axios.get(`https://api.opensea.io/api/v1/asset/${contractAddress}/${tokenId}/?include_orders=false`, options)).data;
    const result = {
        "image_url": assetInfo.image_url,
        "name": assetInfo.name,
        "owner": assetInfo.owner.address
    }
    return result;
}

const getSaleVolume = async (contractAddress, time) => {
    try {
        let interval = "ONE_MINUTE";
        var d = new Date();
        if (time == "1m") {
            d.setMinutes(d.getMinutes() - 2);
        }
        else if (time == "10m") {
            d.setMinutes(d.getMinutes() - 10);
        }
        else if (time == "1h") {
            d.getHours(d.getHours() - 1);

        }
        else if (time == "6h") {
            d.getHours(d.getHours() - 6);
        }
        else if (time == "12h") {
            d.getHours(d.getHours() - 12);
        }
        else if (time == "1d") {
            d.setDate(d.getDate() - 1);
            interval = "ONE_HOUR";
        }
        else if (time == "3d") {
            d.setDate(d.getDate() - 3);
            interval = "SIX_HOURS";
        }
        else if (time == "7d") {
            d.setDate(d.getDate() - 7);
            interval = "SIX_HOURS";
        }
        else if (time == "15d") {
            d.setDate(d.getDate() - 15);
            interval = "SIX_HOURS";
        }
        else if (time == "30d") {
            d.setDate(d.getDate() - 30);
            interval = "ONE_DAY";
        }
        else if (time == "90d") {
            d.setDate(d.getDate() - 90);
            interval = "ONE_DAY";
        }
        else if (time == "1y") {
            d.setFullYear(d.getFullYear() - 1);
            interval = "ONE_DAY";
        }
        var payload = JSON.stringify({
            "operationName": "CollectionOHLCV",
            "variables": {
                "address": contractAddress,
                "filter": {
                    "confirmedAt_gte": d.toISOString(),
                    "interval": interval
                }
            },
            "query": "query CollectionOHLCV($address: String!, $filter: CollectionOHLCVFilterInput) {\n  collection(address: $address) {\n    address\n    ohlcv(filter: $filter) {\n      average\n      close\n      high\n      low\n      open\n      volume\n      timestamp\n      __typename\n    }\n    __typename\n  }\n}"
        });

        var config = {
            method: 'post',
            url: 'https://api.icy.tools/graphql',
            headers: {
                'authority': 'api.icy.tools',
                'accept': '*/*',
                'accept-language': 'en-US,en;q=0.9',
                'apollographql-client-name': 'icy.tools Web Client',
                'apollographql-client-version': '650526aa9a14f2e4782f432ae4412256a3f82863',
                'content-type': 'application/json',
                'cookie': 'rl_page_init_referrer=RudderEncrypt%3AU2FsdGVkX18yrO%2FqPKty7A00i13Ns%2FG44e7RkIuq%2BIg%3D; rl_page_init_referring_domain=RudderEncrypt%3AU2FsdGVkX1%2BfOfb2x3Olc1CBGUnsvqNoRp%2F7MDWjDGU%3D; token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhZGRyZXNzIjoiMHg4OTRmYWNkOWVjZmMyNjEwZWNjZWYzYTdlMDZjM2E3NmNkNjVmODQ1IiwiaWF0IjoxNjYzNzMxNjgxLCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.uKJVOEfB-eL3NcrExVhTXjxjLVafpWzLpBOja5mmJfE; _ga=GA1.1.1410678362.1663870692; icy-developers-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1dWlkIjoiOTI3YTZhM2MtYWQwZC00YzZmLTgwZjktZDgyYzczMmUwYWY4IiwiaWF0IjoxNjYzOTMyNDM2LCJhdWQiOiJhY2NvdW50OnJlZ2lzdGVyZWQifQ.OL1zT8nwfZRpUVCTuFPgnXzutfwv7aL2ZIg9dUQWSoY; __cuid=ce5619f6812a488daaf2335a0acfe135; amp_fef1e8=15510d01-4004-403d-a9ee-579852315704R...1geel4p34.1geel4ts6.p.7.10; _ga_PFQM97KPDB=GS1.1.1664791720.6.1.1664791771.0.0.0; _ga_7212E7ZCBS=GS1.1.1664823472.43.0.1664823473.0.0.0; __cf_bm=M5elvqnB1VGLZ9nWIKAK53lR_HB3Zpj9JapSjDQxfAw-1664826925-0-AQPQMXbKOC0nc9EymoOkXBzj1AQ5TSIWvKUXNgi1+XSKBwmxe9IF1vn47ybc5Jt3Kq5hetVrgmg1nZhcnnSAerxCJv5xrrQ+nRYlo7aU/F70uSwgxRtPC0WSSDk7EGv8Bg==; mp_606dec7de8837f2e0819631c0a3066da_mixpanel=%7B%22distinct_id%22%3A%20%2218398adcabe456-070ddaf983962-26021c51-100200-18398adcabf58b%22%2C%22%24device_id%22%3A%20%2218398adcabe456-070ddaf983962-26021c51-100200-18398adcabf58b%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; mp_e950e8f150e2e3d7c790b0ca38b641af_mixpanel=%7B%22distinct_id%22%3A%20%2218398adccbd3e6-06fdcca3f23b7a-26021c51-100200-18398adccbe474%22%2C%22%24device_id%22%3A%20%2218398adccbd3e6-06fdcca3f23b7a-26021c51-100200-18398adccbe474%22%2C%22%24initial_referrer%22%3A%20%22%24direct%22%2C%22%24initial_referring_domain%22%3A%20%22%24direct%22%7D; rl_user_id=RudderEncrypt%3AU2FsdGVkX19BtNo4bXZd0f8rttEid3F7SqBJo4YQQgjZzuEr%2F0ii%2FKRgGDU3KEbsm%2BMZTcZ0Os9brmFWkBZ9UQ%3D%3D; rl_trait=RudderEncrypt%3AU2FsdGVkX186EEOcZaY5C5IqXbararPDX2vTfWGAy2w%3D; rl_group_id=RudderEncrypt%3AU2FsdGVkX1%2FQ%2BTThqy1ApLvokm6vTqhBvGxm5rTNH5s%3D; rl_group_trait=RudderEncrypt%3AU2FsdGVkX19h2cTF1IuCK%2B3%2FHAfkc9A0c2wgzyAH3mY%3D; rl_anonymous_id=RudderEncrypt%3AU2FsdGVkX18ss4IeqGAYHQ20Hahl0uFOaSRuDEhDs88hp292WGYkOLxFK023GRpbAtaPjLQP4NW171GyBILqCQ%3D%3D',
                'origin': 'https://icy.tools',
                'referer': 'https://icy.tools/',
                'sec-ch-ua': '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"Windows"',
                'sec-fetch-dest': 'empty',
                'sec-fetch-mode': 'cors',
                'sec-fetch-site': 'same-site',
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36',
                'x-security-token': '733bd44c-5df7-45df-8bf4-ccbfc43d46f5'
            },
            data: payload
        };
        const { data } = await axios(config);
        return data.data.collection;
    }
    catch (e) {
        console.log(e);
    }
    return [];
}
const search = async (query) => {
    var data = JSON.stringify({
        "id": "NavSearchCollectionsQuery",
        "query": "query NavSearchCollectionsQuery(\n  $query: String!\n) {\n  searchCollections(first: 4, query: $query) {\n    edges {\n      node {\n        imageUrl\n        isVerified\n        name\n        relayId\n        statsV2 {\n          totalSupply\n          floorPrice {\n            unit\n            symbol\n          }\n        }\n        defaultChain {\n          identifier\n        }\n        drop {\n          ctaStage {\n            startTime\n            endTime\n            id\n          }\n          id\n        }\n        ...collection_url\n        ...useRecentViews_data\n        id\n      }\n    }\n  }\n}\n\nfragment collection_url on CollectionType {\n  slug\n  isCategory\n}\n\nfragment useRecentViews_data on CollectionType {\n  relayId\n  slug\n  imageUrl\n  isVerified\n  name\n  statsV2 {\n    totalSupply\n  }\n  defaultChain {\n    identifier\n  }\n  ...collection_url\n}\n",
        "variables": {
            "query": query
        }
    });
    this.client = new Client();
    await this.client.init({
        type: "preset",
        preset: "chrome83",
    });
    res = await this.client.request({

        url: `https://opensea.io/__api/graphql/`,
        method: "POST",
        headers: [
            ['authority', 'opensea.io'],
            ['accept', '*/*'],
            ['accept-language', 'en-US,en;q=0.9'],
            ['content-type', 'application/json'],
            // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
            ['origin', 'https://opensea.io'],
            ['referer', 'https://opensea.io/'],
            ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
            ['sec-ch-ua-mobile', '?0'],
            ['sec-ch-ua-platform', '"Windows"'],
            ['sec-fetch-dest', 'empty'],
            ['sec-fetch-mode', 'cors'],
            ['sec-fetch-site', 'same-origin'],
            ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
            ['x-app-id', 'opensea-web'],
            ['x-build-id', 'ac82dac61d5f6f693487475bb448b6b497c4a369'],
            ['x-signed-query', '6a221e47ee626f5e4374f940a2b3701005710c34d14bfc563872baf230c920eb']

        ],
        "body": data
    });
    console.log(res);
    if (res.statusCode == 403) {
        await delay(1000);
        return (await search(query));
    }


    let response = []

    try {

        response = JSON.parse(res.body).data.searchCollections.edges;
        console.log(response.length)

        if (response.length == 0) {

            //atempt icy search
            var res2 = await getIcySearch(query)
            console.log(`sondary search results: ${res2}`)

            if (res2.data.length == 0) {


                //attempt to call traitsniper api if collection exists
                var res = await getCollInfoTS(query);
                //console.log(res)
                let tertiarylist = JSON.parse(res.body).projects;
                console.log(tertiarylist)
                return {
                    resultSrc: "tertiarySrc",
                    results: tertiarylist
                }


            } else {

                let secondarylist = res2;
                console.log(secondarylist)
                return {
                    resultSrc: "secondarySrc",
                    results: secondarylist
                }


            }








        } else {

            return {
                resultSrc: "mainSrc",
                results: response
            }

        }


    } catch (err) {

        console.log(err.message)

    }





    return response;



}





const getNScollectionData = async (collectionAddress) => {


    //https://nftscoring.com/_next/data/ejHu5pKC5533VbNKWiJ5Q/collection/0x3df5c619a4926156f966a64e08f863385c21da0e.json?id=0x3df5c619a4926156f966a64e08f863385c21da0e

    this.client = new Client();

    var randomNumber = Math.floor(Math.random() * presetArray.length);


    await this.client.init({
        type: "preset",
        preset: presetArray[randomNumber].preset,
    });


    var options = {
        url: `https://nftscoring.com/_next/data/ejHu5pKC5533VbNKWiJ5Q/collection/${collectionAddress}.json?id=${collectionAddress}`,
        method: "GET",
        headers: [
            //['authority', 'opensea.io'],
            ['accept', '*/*'],
            ['accept-language', 'en-US,en;q=0.9'],
            //['content-type', 'application/json'],
            // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
            //['origin', 'https://opensea.io'],
            //['referer', 'https://opensea.io/'],
            //['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
            ['sec-ch-ua-mobile', '?0'],
            //['sec-ch-ua-platform', '"Windows"'],
            ['sec-fetch-dest', 'empty'],
            ['sec-fetch-mode', 'cors'],
            ['sec-fetch-site', 'same-origin'],
            //['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
            //['x-app-id', 'opensea-web'],
            //['x-build-id', 'af2a3f21c162f8953f49c49349206b52e4b71667'],
            //['x-signed-query', 'dc212a3e42833aa98a090bf576bd8966928927b5b746082ad1c1eb96933f6e9a']

        ]
    }

    options.headers.push(['user-agent', presetArray[randomNumber].ua])


    let res = await this.client.request(options);
    //console.log(res)

    return res.body;



}


const getTwitterInfo = async (collectionAddress) => {

    try {
        var varfullStats = await getNScollectionData(collectionAddress)

        var collectionDataObj = JSON.parse(varfullStats)


        return {
            message: "Data is delayed vs live twitter count info...",
            twitterUsername: collectionDataObj.pageProps.nftData.twitter_username,
            profileImage: collectionDataObj.pageProps.nftData.twitter.profile_url,
            followers: collectionDataObj.pageProps.nftData.twitter.followers_count
        }
    } catch (err) { return { error: "Cannot find any twitter info for collection", details: err.message } }
}



const collectioninfoV2 = async (slug) => {

    var data = JSON.stringify({
        "id": "CollectionOfferMultiModalBaseQuery",
        "query": "query CollectionOfferMultiModalBaseQuery(\n  $collection: CollectionSlug!\n  $chain: ChainScalar!\n) {\n  collection(collection: $collection) {\n    slug\n    verificationStatus\n    ...OfferModal_collectionData\n    id\n  }\n  tradeLimits(chain: $chain) {\n    ...OfferModal_tradeLimits\n  }\n}\n\nfragment OfferModal_collectionData on CollectionType {\n  isTraitOffersEnabled\n  name\n  slug\n  relayId\n  statsV2 {\n    floorPrice {\n      usd\n      symbol\n    }\n  }\n  ...useOfferModalAdapter_collection\n}\n\nfragment OfferModal_tradeLimits on TradeLimitsType {\n  minimumBidUsdPrice\n  ...useOfferModalAdapter_tradeLimits\n}\n\nfragment useOfferModalAdapter_collection on CollectionType {\n  relayId\n  slug\n  paymentAssets {\n    relayId\n    symbol\n    chain {\n      identifier\n    }\n    asset {\n      usdSpotPrice\n      decimals\n      id\n    }\n    isNative\n    ...utils_PaymentAssetOption\n    id\n  }\n  representativeAsset {\n    assetContract {\n      address\n      chain\n      id\n    }\n    id\n  }\n  assetContracts(first: 2) {\n    edges {\n      node {\n        address\n        chain\n        id\n      }\n    }\n  }\n}\n\nfragment useOfferModalAdapter_tradeLimits on TradeLimitsType {\n  minimumBidUsdPrice\n}\n\nfragment utils_PaymentAssetOption on PaymentAssetType {\n  relayId\n  symbol\n  asset {\n    relayId\n    displayImageUrl\n    usdSpotPrice\n    decimals\n    id\n  }\n}\n",
        "variables": {
            "collection": slug,
            "chain": "ETHEREUM"
        }
    });

    this.client = new Client();
    await this.client.init({
        type: "preset",
        preset: "chrome83",
    });
    res = await this.client.request({

        url: `https://opensea.io/__api/graphql/`,
        method: "POST",
        headers: [
            ['authority', 'opensea.io'],
            ['accept', '*/*'],
            ['accept-language', 'en-US,en;q=0.9'],
            ['content-type', 'application/json'],
            // ['cookie', '__os_session=eyJpZCI6Ijc5OWE2MjU0LTY2ZDktNGEwYy05MTM2LTc3MTZhYzJiZDExOSJ9; __os_session.sig=mH56UFuB7XG-2XGDIBmy9kT_koT3d776s14AWyDpGgc; _gcl_au=1.1.1170936312.1660380945; ajs_anonymous_id=e90d283a-6837-435d-a74c-c73bf5bc8ab0; _gid=GA1.2.1855041075.1663933104; __cf_bm=kI5vgZ4uRRPik_c9HdIVwY1BMp4XeFG_rKN2oL8UMLM-1664304474-0-AeLPXCIvkTy9GMZ7c1OIsv7B4Kj+75c8jCHRvfsG0p+jG7U28DPTQ6OihhpbaBgXy/tpikz5s7e4elg3hzBEsV0=; csrftoken=sDikl1YbmSxEnxL0un06CePW5CiY4ruK; sessionid=eyJzZXNzaW9uSWQiOiI3OTlhNjI1NC02NmQ5LTRhMGMtOTEzNi03NzE2YWMyYmQxMTkifQ:1odFii:RnvRR88eJ0SCy_J4Rft_-_TVfOjwtN_HFOYwSp0TSgo; _ga_9VSBF2K4BX=GS1.1.1664304482.35.1.1664304858.0.0.0; _ga=GA1.1.1039742238.1660027005; _uetsid=3d4996e03b3411edaab4a3c85a8a1ea4; _uetvid=bca469c01ae511ed8e5d17da58400a7c; amp_ddd6ec=NxMxoPblMAX_Bs7nouOo--...1ge04e16e.1ge04pi8i.4t.56.a3; _dd_s=rum=0&expire=1664306179716; _gat_gtag_UA_111688253_1=1'],
            ['origin', 'https://opensea.io'],
            ['referer', 'https://opensea.io/'],
            ['sec-ch-ua', '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"'],
            ['sec-ch-ua-mobile', '?0'],
            ['sec-ch-ua-platform', '"Windows"'],
            ['sec-fetch-dest', 'empty'],
            ['sec-fetch-mode', 'cors'],
            ['sec-fetch-site', 'same-origin'],
            ['user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36'],
            ['x-app-id', 'opensea-web'],
            ['x-build-id', 'ac82dac61d5f6f693487475bb448b6b497c4a369'],
            ['x-signed-query', 'be6d987c1b4dc0f257a3f20eac0e0e92cfcc3a6c775a56a7f8a68b4b0053332f']

        ],
        "body": data
    });

    let response = JSON.parse(res.body).data;
    return response;
}
module.exports = {
    getCollectionInfo, getCollectionInfoV1, getSalesDataAssets, getSalesLiveData, getFeedsDataAssets, getListingDataAssets, saveSalesData, saveListingData, assetsForSales, getSellWall,
    getHolderInfo, getHolderInfoByTime, getFloorPrice, getCollectionInfo, getCollectionSlug, getAssetInfo, getCollectionName, getMinterInfo, getTraders, getListingHistory, getListed, getStats1, getStats, getSaleVolume, search, collectioninfoV2,
    getCollectionTraits, getTwitterInfo, getNScollectionData, getFilteredTokens
};
