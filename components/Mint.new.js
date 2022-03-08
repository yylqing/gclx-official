import { useState, useEffect } from "react";
import styled from "styled-components";
import { ethers } from "ethers";
import Typography from "@mui/material/Typography";
import Web3 from 'web3';
import { get, subscribe } from "../store";
import Container from "./Container";
import ConnectWallet, { connectWallet } from "./ConnectWallet";
import showMessage from "./showMessage";
import HuaJiaContractABI from "../abi/huajia.json";

const contractABI = HuaJiaContractABI;

let contract;
let web3;
let miaoShu;


const ETHERSCAN_DOMAIN =
  process.env.NEXT_PUBLIC_CHAIN_ID === "1"
    ? "etherscan.io"
    : "rinkeby.etherscan.io";

const Content = styled.div`
  max-width: 840px;
  margin: 0 auto 5% auto;
  strong {
    color: red;
  }
`;

const MintInput = styled.div`
  max-width: 40px;
  strong {
    color: red;
  }
`;

const StyledMintButton = styled.div`
  display: inline-block;
  width: 140px;
  text-align: center;
  padding: 10px 10px;
  border: 4px solid #000;
  border-radius: 20px;
  color: #000;
  background: #dde4b6;
  cursor: ${(props) => {
    return props.minting || props.disabled ? "not-allowed" : "pointer";
  }};
  opacity: ${(props) => {
    return props.minting || props.disabled ? 0.6 : 1;
  }};
`;

function MintButton(props) {
  const [minting, setMinting] = useState(false);

  return (
    <StyledMintButton
      disabled={!!props.disabled}
      minting={minting}
      onClick={async () => {
        if (minting || props.disabled) {
          return;
        }
        setMinting(true);
        try {
          if (!miaoShu) {
            showMessage({
              type: "error",
              title: "请告诉我们你想要画什么？",
              body: "请告诉我们你想要画什么？",
            });
          } else {
            const value = 0.1;
            const BN = web3.utils.BN
            const amount = new BN(web3.utils.toWei(value.toString(), 'ether'))
            contract.methods.maiHua(miaoShu).send({
              from: get('fullAddress'),
              value: amount,
              gas: 3000000
            }, function (error, result) {
              if (!error) {
                showMessage({
                  type: "success",
                  title: "铸造成功",
                  body: (
                    <div>
                      <a
                        href={`https://www.oklink.com/zh-cn/oec-test/tx/${result}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        点击查看交易详情
                      </a>{" "}
                    </div>
                  ),
                });
                return
              } else {
                showMessage({
                  type: "error",
                  title: "铸造失败",
                  body: error,
                });
              }
            })
          }


        } catch (err) {
          showMessage({
            type: "error",
            title: "铸造失败",
            body: err.message,
          });
        }
        props.onMinted && props.onMinted();
        setMinting(false);
      }}
      style={{
        background: "#dde4b6",
        ...props.style,
      }}
    >
      铸造 {props.mintAmount} 个{minting ? "中..." : ""}
    </StyledMintButton>
  );
}

function MintSection() {
  const [status, setStatus] = useState("0");
  const [progress, setProgress] = useState(null);
  const [fullAddress, setFullAddress] = useState(null);
  const [numberMinted, setNumberMinted] = useState(0);

  async function updateStatus() {
    // const { contract } = await connectWallet();
    web3 = new Web3(window.ethereum)
    contract = new web3.eth.Contract(contractABI.abi, process.env.NEXT_PUBLIC_CONTRACT_ADDRESS)
    const status = 1
    console.log(13)
    const progress = await contract.methods.totalSupply().call();
    console.log(progress)
    setStatus(status.toString());
    setProgress(progress);
    // 在 mint 事件的时候更新数据
    // contract.on("Minted", async (event) => {
    //   const status = await contract.status();
    //   const progress = parseInt(await contract.totalSupply());
    //   setStatus(status.toString());
    //   setProgress(progress);
    // });
  }

  useEffect(() => {
    (async () => {
      const fullAddressInStore = get("fullAddress") || null;
      if (fullAddressInStore) {
        setFullAddress(fullAddressInStore);
      }
      subscribe("fullAddress", async () => {
        const fullAddressInStore = get("fullAddress") || null;
        setFullAddress(fullAddressInStore);
        if (fullAddressInStore) {
          updateStatus();
        }
      });
    })();
  }, []);

  useEffect(() => {
    try {
      const fullAddressInStore = get("fullAddress") || null;
      if (fullAddressInStore) {
        updateStatus();
      }
    } catch (err) {
      showMessage({
        type: "error",
        title: "获取合约状态失败",
        body: err.message,
      });
    }
  }, []);

  async function refreshStatus() {
    const { contract } = await connectWallet();
  }

  let mintButton = (
    <StyledMintButton
      style={{
        background: "#eee",
        color: "#999",
        cursor: "not-allowed",
      }}
    >
      尚未开始
    </StyledMintButton>
  );
  if (status === "1") {
    mintButton = (
      <div
        style={{
          display: "flex",
        }}
      >
        <MintButton
          onMinted={refreshStatus}
          mintAmount={1}
          style={{ marginRight: "20px" }}
        />
        <input style={{ borderRadius: "20px", width: "500px" }} type="text" onChange={(e) => inputChange(e)} placeholder="请告诉我们，你想要什么样的画" />


      </div>
    );
  }

  function inputChange(e) {
    //获取dom节点元素
    //1.添加ref属性
    //2.使用this.refs.username获取dom节点
    miaoShu = e.target.value;
  }

  if (progress >= 1000 || status === "2") {
    mintButton = (
      <StyledMintButton
        style={{
          background: "#eee",
          color: "#999",
          cursor: "not-allowed",
        }}
      >
        全部卖完了
      </StyledMintButton>
    );
  }



  if (!fullAddress) {
    mintButton = (
      <StyledMintButton
        style={{
          background: "#eee",
          color: "#999",
          cursor: "not-allowed",
        }}
      >
        请先连接钱包
      </StyledMintButton>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ marginBottom: 20, display: "flex", alignItems: "center" }}>
        您的钱包： <ConnectWallet />{" "}
      </div>
      {mintButton}

      <div style={{ marginTop: 20, fontSize: 20, textAlign: "center" }}>
        铸造进度：{progress === null ? "请先连接钱包" : progress} / 1000，价格
        0.01 BNB 一个。
        <br />
        今天，我们是国产画家！
      </div>
    </div>
  );
}

function Mint() {
  return (
    <Container
      style={{
        background: "#5383b2",
        color: "#fff",
      }}
      id="mint"
    >
      <Typography
        style={{ textAlign: "center", marginTop: "5%" }}
        variant="h3"
        gutterBottom
        component="div"
      >
        铸造（Mint）
      </Typography>

      <Content>
        <Typography
          style={{
            marginTop: "5%",
            textAlign: "center",
          }}
          variant="body1"
          gutterBottom
        >
          您好我的朋友，有没有觉得这个国产良心 NFT
          项目网站跟别的项目不太一样？上面废话特别多，Mint
          的按钮和方法一直找不到？
        </Typography>
        <Typography
          style={{
            marginTop: 30,
            textAlign: "center",
          }}
          variant="body1"
          gutterBottom
        >
          这并非因为我们不懂用户体验，相反，我们希望您在参与任何一个项目的时候，都能认真研究项目背后的团队、理念、发展路线和风险。不要
          FOMO 也不要 FUD，要理性的决定自己是否要参与这个项目！
        </Typography>
        <Typography
          style={{
            marginTop: 30,
            textAlign: "center",
          }}
          variant="body1"
          gutterBottom
        >
          相信通过上面的资料，相信您已经充分了解了我们国产良心 NFT
          项目。在您做好充分的思想准备之后，可以选择点击下面铸造（Mint）按钮进行铸造。
        </Typography>

        <div
          style={{
            marginTop: 60,
            border: "4px dashed #000",
            padding: "40px",
            borderRadius: 20,
          }}
        >
          <MintSection />
        </div>
        <Typography
          style={{ textAlign: "center", marginTop: "8%" }}
          variant="h5"
          gutterBottom
          component="div"
        >
          铸造之后
        </Typography>
        <Typography
          style={{
            marginTop: 30,
            textAlign: "center",
          }}
          variant="body2"
          gutterBottom
        >
          铸造成功之后，您可以选择加入国产良心 NFT
          会员频道，不过项目团队不会在里面做管理或者组织什么事情。
          <br />
          为了节约时间，经过和 NextDAO 的沟通，我们将会员频道设立在了 NextDAO 的
          Discord 里面。
          <br />
          您可以加入 NextDAO 的 Discord （
          <a
            style={{ color: "#fff" }}
            href="https://discord.gg/NextDAO"
            target="_blank"
            rel="noreferrer"
          >
            https://discord.gg/NextDAO
          </a>
          ） 并链接钱包验证身份，之后即可看到会员频道。
        </Typography>
      </Content>
    </Container>
  );
}

export default Mint;
