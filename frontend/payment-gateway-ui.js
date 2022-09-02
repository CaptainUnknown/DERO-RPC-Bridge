import "./payment-gateway-ui.scss"
import React, { useState } from "react"
import ReactDOM from "react-dom"
import ReactTooltip from 'react-tooltip'

import { completePurchase } from "./completePurchase"
import rpcCall from './rpcCall'

var attributes;
document.addEventListener("DOMContentLoaded", (event) => {
    const allAttributes = document.querySelectorAll(".attributes");
    allAttributes.forEach(attributeElement => {
        attributes = JSON.parse(attributeElement.innerText);
        const currentBlockName = attributes.name;
        const currentBlock = document.querySelectorAll('.replace-' + currentBlockName)[0];
        ReactDOM.render(<Gateway {...attributes}/>, currentBlock);
        currentBlock.classList.remove("replace-" + currentBlockName);
    });
});

const Gateway = (props) => {
  const [authenticatorVisibility, setAuthenticatorVisibility] = useState(true);
  const [txidVisibility, setTxidVisibility] = useState(false);
  const [confirmTxVisibility, setConfirmTxVisibility] = useState(false);

  const [authenticator, setAuthenticator] = useState("");

  var DEROPrice;
  var txid = "bf4b2cd942f4394a03d0d66bbf8c0639f5cbcbf340becc39d4c9e02f987cecca";
  console.log('Current User ID:' + attributes.user_id);

  let isCustom = new Boolean(false);
  let isDirectTransfer = new Boolean(false);
  if (attributes.transferMethod == 'ctsc') {
    isCustom = true;
  } else if (attributes.transferMethod == 'cdsc') {
    isCustom = false;
  } else if (attributes.transferMethod == 'dt') {
    isDirectTransfer = true;
  } else {
    return <div className="payBlock"> <p> ❌  Missing Transfer Method, Please select one of the payment methods. </p> </div>
  }

  if (isCustom == true) {
    if (attributes.TSCID == undefined) {
      return <div className="payBlock"> <p> ❌  Missing Token Smart Contract ID, Gateway needs a valid Smart Contract. </p> </div>
    }
    if (attributes.tokenAmount == undefined) {
      return <div className="payBlock"> <p> ❌  Missing Token Price, Gateway needs a valid Token Price. </p> </div>
    }
    if (attributes.SCRPC == undefined) {
      return <div className="payBlock"> <p> ❌  Missing Smart Contract RPC Parameters. </p> </div>
    }
  } else {
    if (attributes.DSCID == undefined) {
      return <div className="payBlock"> <p> ❌  Missing DERO Smart Contract ID, Gateway needs a valid Smart Contract. </p> </div>
    }
    if (attributes.USDamount == undefined) {
      return <div className="payBlock"> <p> ❌  Missing USD Price, USD Price needs to be greater than 0. </p> </div>
    }
    if (attributes.SCRPC == undefined) {
      return <div className="payBlock"> <p> ❌  Missing Smart Contract RPC Parameters. </p> </div>
    }
  }

  if (isDirectTransfer == true) {
    if (attributes.destinationWalletAddress == undefined) {
      return <div className="payBlock"> <p> ❌  Missing Destination Wallet Address, Please enter a valid wallet address to recieve your revenue in. </p> </div>
    }
    if (attributes.USDamount == undefined) {
      return <div className="payBlock"> <p> ❌  Missing USD Price, USD Price needs to be greater than 0. </p> </div>
    }
  }

  //Comment out this block if you are using custom script as completePurchase.js
  let isShopify = new Boolean(false);
  let isLearnDash = new Boolean(false);
  let isCustomEP = new Boolean(false);
  if (attributes.actionPreset == 'shopify') {
    isShopify = true;
  } else if (attributes.actionPreset == 'learnDash') {
    isLearnDash = true;
  } else if (attributes.actionPreset == 'customEP') {
    isCustomEP = true;
  } else {
    return <div className="payBlock"> <p> ❌  Missing Action Preset, Please select atleast of the actions to be executed after a successful purchase. </p> </div>
  }

  if (isShopify == true) {
    if (attributes.shopifyStoreName == undefined) {
      return <div className="payBlock"> <p> ❌  Missing  ,  . </p> </div>
    }//This check will not be required 
    if (attributes.shopifyAccessToken == undefined) {
      return <div className="payBlock"> <p> ❌  Missing  ,  . </p> </div>
    }
  } else if (isLearnDash == true) {
    if (attributes.courseID == undefined) {
      return <div className="payBlock"> <p> ❌  Missing Course ID, Needs a valid course ID for the user to purchase. </p> </div>
    }
    if (attributes.courseSiteURL == undefined) {
      return <div className="payBlock"> <p> ❌  Missing Course Site URL, Please provide a valid your website URL (where courses are hosted on). </p> </div>
    }
  } else if (isCustomEP == true) {
    if (attributes.fetchMethod == undefined) {
      return <div className="payBlock"> <p> ❌  Missing Fetch Method, Please select a valid Fetch Method for your Custom Endpoint. </p> </div>
    } else if (attributes.fetchMethod == "POST" || attributes.fetchMethod == "PUT") {
      if (attributes.CEPBody == undefined) {
        return <div className="payBlock"> <p> ❌  Missing Fetch Body, Non-stringified Body is required for Fetch Methods, PUT & POST. </p> </div>
      }
    } else {
      if (attributes.CEPURL == undefined) {
        return <div className="payBlock"> <p> ❌  Missing Fetch URL, A valid URL is required for all Fetch Methods. </p> </div>
      }
      if (attributes.CEPHeader == undefined) {
        return <div className="payBlock"> <p> ❌  Missing Fetch Header, Non-stringified Header is required for all Fetch Methods. </p> </div>
      }
    }
  }

  //Validates whether the course with provided courseID exists or not
  let isCourseIDValid = new Boolean(true);
  const checkCourseID = async () => {
    await fetch(attributes.courseSiteURL + attributes.courseID)
      .then(response => response.json())
      .then(data => {
        if (data.date == undefined) {
          isCourseIDValid = false;
        } else if (data.date) {
          isCourseIDValid = true;
        }
      })
      .catch(error => {
        console.log(error);
        isCourseIDValid = false;
      });

    console.log('Is Course ID Valid: ' + isCourseIDValid);
    if (!isCourseIDValid) {
      console.warn('⚠️ Invalid Course ID, It seems either the CourseID or the Course Site URL or both of the parameters you provided are invalid. Plugin may not function as expected!');
    }
  }
  checkCourseID();

  let isAPIKeyValid = new Boolean(true);
  fetch('https://api.livecoinwatch.com/coins/single', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': attributes.APIKey
    },
    body: JSON.stringify({
      "currency": "USD",
      "code": "DERO"
    })
  })
    .then(res => {
      res.json();
      if (res.error.code == 401) {
        isAPIKeyValid = false;
      }
    })
    .catch(error => {
      isAPIKeyValid = false;
    });

  if (!isAPIKeyValid) {
    attributes.APIKey = undefined;
    console.warn('API Key is invalid, Chaning it to Default key (Providing one ensures the plugin wont run out of daily API Limit).');
  }

  const USDtoDERO = () => {
    let myAPIKey;
    if (attributes.APIKey == undefined || attributes.APIKey == '') {
      //Default API Key
      myAPIKey = 'c8573f42-e797-43e9-811d-07effb255ad8';
    } else {
      myAPIKey = attributes.APIKey;
    }

    var rawResponse;
    fetch("https://api.livecoinwatch.com/coins/single", {
      body: "{\"currency\":\"USD\",\"code\":\"DERO\",\"meta\":false}",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": myAPIKey
      },
      method: "POST"
    })
      .then(res => res.json())
      .then(data => {
        rawResponse = data;

        const content = rawResponse;
        let currentRate = content.rate;

        let DEROamount = attributes.USDamount * (1 / currentRate);
        DEROamount = DEROamount.toFixed(5);
        DEROamount = parseFloat(DEROamount) * 100000;
        console.log(content);
        console.log(DEROamount);

        DEROPrice = DEROamount;
      })
      .catch(err => {
        alert('🌐 Something went wrong while getting current exchange rates for DERO, Please try again later.');
        console.log(err);
        console.error('If you are owner of this site, try changing Livecoinwatch API key');
        return <div className="payBlock"> <p> ❌  Something Went wrong, Please try again later. </p> </div>
      });
  }
  USDtoDERO();

  //const getWalletBalance = async () => {
  //return 'Wallet Balance 📇: ' + res.data.result.balance / 100000 + ' DERO'
  //}

  const transact = async () => {
    console.log(DEROPrice);
    if(attributes.isDirectTransfer == 'on'){
      //let options = { 'authenticator': userPass, 'method':'Echo', 'params':'["Hello", "World", "!"]' };
      //rpcCall(options);
      //const res = await rpcCall({ ...options, method: 'DERO.Ping' })
      //if {
      //  (res.err) return Promise.reject(new Error(res.err))
      //  console.log(err);
      //  alert('Transact Failed 🌐, Check Console for more details.');
      //} else {
      //  completePurchase(attributes.courseID, attributes.user_id)
      //  console.log(response);
      //  setTxidVisibility(true);
      //}
    }
    else if (!isCustom && attributes.isDirectTransfer == 'off'){
    }
  }


  let currency = 'USD';
  if (isCustom) {
    currency = 'Tokens';
  }
  if (attributes.isDirectTransfer == 'on') {
    currency = 'USD';
  }

  return (<>
    <div className="authWrapper" style={{ display: authenticatorVisibility ? "flex" : "none" }}>
      <div className="authenticator" style={{ height: "200px" }}>
        Authenticator:
        <input data-tip="❕Please provide authenticator key (from CyberDeck if you are using Engram Or from --rpc-login if you are using CLI Wallet)." type='text' id='authenticator' value={props.authenticator} placeholder='user:password' onChange={setAuthenticator} />
        <ReactTooltip />
        <button onClick={() => {setAuthenticatorVisibility(false)}}> Next </button>
      </div>
    </div>


    <div className="payBlock">
      <h3> Pay with DERO 🔏🪙</h3>

      <button>Purchase</button>
      <button>Check My Wallet Balance</button>
      <button>Check My Token Balance</button>
      <p>Price: {props.USDamount} {currency}</p><p>bridgeInitText</p>
    </div>



    <div className="authWrapper" style={{ display: confirmTxVisibility ? "flex" : "none" }}>
      <div className="authenticator" style={{ height: "300px" }}>
        Do you want to proceed with this transaction? <br />
        {isDirectTransfer ? <> You will be sending <p> {props.USDamount} {currency} </p> to <p> {props.destinationWalletAddress} </p></> : <> Smart Contract ID to be invoked: <p> {props.DSCID} </p> <p> {props.TSCID} </p></>}
        <button onClick={() => {setConfirmTxVisibility(false)}}> Confirm </button> {/*Add Transaction function*/}
      </div>
    </div>

    <div className="authWrapper" style={{ display: txidVisibility ? "flex" : "none" }}>
      <div className="authenticator" style={{ height: "225px" }}>
        Congrats! Transaction was successful, here's your transaction ID:
        <p> {txid} </p>
        <button onClick={() => {setTxidVisibility(false);
        setTimeout(() => {
          console.log('Refreshing...');
          window.location.reload();
        }, 1000)}}> OK </button>
      </div>
    </div>
  </>)
}