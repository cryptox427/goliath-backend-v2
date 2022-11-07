const axios = require("axios");
const moment = require("moment");

const calculatorBuyRank = async (rarity) => {
    const result = ((rarity % 1000) * 5) % 1000;
    return result;  
}



module.exports = { calculatorBuyRank };