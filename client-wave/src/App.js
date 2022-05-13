import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import wavePortal from './utils/WavePortal.json';

const App = () => {
  const [currentAccount, setCurrentAccount] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [gifOn, setGifOn] = useState(false);

  const [allWaves, setAllWaves] = useState([]);
  const contractAddress = "0xcDb92Efa941b936fFEeA2Dc69dF624F27E4ed9A5";
  const contractABI = wavePortal.abi;
  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Listen in for emitter events!
   */
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);


  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        getAllWaves();

      } else {
        console.log("No authorized account found")
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);

    } catch (error) {
      console.log(error)
    }
  }

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, wavePortal.abi, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());


        setGifOn(true);
        const waveTxn = await wavePortalContract.wave(messageInput, { gasLimit: 300000 })
        setMessageInput("");

        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        setGifOn(false);


        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWalletIsConnected();

  }, [currentAccount])

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          <span role="img" >👋</span>  Wave Portal


        </div>
        <div style={{ marginTop: "30px" }}>
          Send us a message, and stand a chance to win some cash
        </div>
        {
          currentAccount &&
          (<>

            <input type="text" onChange={(e) => setMessageInput(e.target.value)} value={messageInput} />

            <button className="waveButton" onClick={wave}>
              Wave at Me
            </button>
            <div style={{ background: "#e3d3ff", padding: "12px", marginTop: "10px" }}>Connected: {currentAccount}</div>
            <h2 style={{ marginTop: "30px" }}>
              Messages:
            </h2>

          </>)

        }

        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {gifOn && (<div style={{ textAlign: "center" }}>

          <iframe src="https://giphy.com/embed/3oEjI6SIIHBdRxXI40" width="200" height="200" frameBorder="0" class="giphy-embed" allowFullScreen></iframe>
        </div>)
        }
        {

          !gifOn &&
          allWaves.map((wave, index) => {
            return (
              <div key={index} className="messageBox">
                <div>Address: {wave.address}</div>
                <div>Time: {wave.timestamp.toString()}</div>
                <div>Message: {wave.message}</div>
              </div>)
          })}
      </div>
    </div>
  );
}

export default App