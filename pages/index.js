"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { ethers } from "ethers";
import Countdown from "react-countdown";
import tokenABI from "../tokenABI/tokenABI.json";
import Marquee from "react-fast-marquee";

import {
  useDisconnect,
  useNetworkMismatch,
  useMetamask,
  useAddress,
  useBalance,
  useConnectionStatus,
  useContract,
  useContractRead,
  useContractWrite,
  useTokenBalance,
  useSwitchChain,
  ConnectWallet,
  useNetwork,
  useMetadata,
} from "@thirdweb-dev/react";
import { Goerli, BinanceTestnet, Binance } from "@thirdweb-dev/chains";

export default function Home() {
  const [isMenuOpen, setMenu] = useState(false);
  const [historyValue, setHistory] = useState(0);
  const [lotteryData, setLotteryData] = useState();
  // const [ticketNumberQuantity, setTicketNumberQuantity] = useState("");

  const [allowance, setAllowance] = useState();
  const [chancePrice, setChancePrice] = useState("");

  const [formattedPrice, setFormattedPrice] = useState();
  console.log(
    "🚀 ~ file: page.js:300 ~ Home ~ formattedPrice:",
    formattedPrice
  );

  const disconnect = useDisconnect();
  const isMismatched = useNetworkMismatch();

  const switchChain = useSwitchChain();
  const [, switchNetwork] = useNetwork();

  const connectionStatus = useConnectionStatus();
  const address = useAddress();
  const connectWithMetamask = useMetamask();

  const [userTickets, setUserTickets] = useState(0);
  const [quantity, setQuantity] = useState(1);
  console.log("🚀 ~ file: page.js:36 ~ Home ~ quantity:", quantity);

  const { contract, isLoading } = useContract(
    process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS
  );

  console.log("address", address);

  const { contract: tokenContract } = useContract(
    process.env.NEXT_PUBLIC_MAIN_TOKEN_CONTRACT_ADDRESS,
    "token"
  );
  console.log("contract", contract);
  console.log("token contract", tokenContract);

  const { data: tokenMetadata } = useMetadata(tokenContract);
  console.log("🚀 ~ file: index.js:72 ~ Home ~ tokenMetadata:", tokenMetadata)

  const { contract: chanceContract } = useContract(
    process.env.NEXT_PUBLIC_MAIN_TOKEN_CONTRACT_ADDRESS,
    tokenABI
  );

  console.log("🚀 ~ file: page.js:61 ~ Home ~ chanceContract:", chanceContract);

  const { data: tokenDetails } = useTokenBalance(tokenContract, address);
  const { data: chanceDetails } = useTokenBalance(chanceContract, address);
  console.log("🚀 ~ file: page.js:69 ~ Home ~ chanceDetails:", chanceDetails);
  console.log("🚀 ~ file: page.js:49 ~ Home ~ tokenDetails:", tokenDetails);

  const tokenBalanceBal = tokenDetails?.displayValue;
  const tokenSymbol = tokenMetadata?.symbol;
  const tokenName = tokenMetadata?.name;
  const tokenDecimal = tokenDetails?.decimals;

  const ticketUserCanBuy = 20 - userTickets;

  const { data: remainingTickets } = useContractRead(
    contract,
    "RemainingTickets"
  );
  console.log(
    "🚀 ~ file: page.js:58 ~ Home ~ remainingTickets:",
    remainingTickets
  );

  const { data: pricePool } = useContractRead(contract, "CurrentWinningReward");
  console.log("🚀 ~ file: page.js:63 ~ Home ~ pricePool:", pricePool);
  const { data: checkWinningsAmount } = useContractRead(
    contract,
    "checkWinningsAmount"
  );
  console.log(
    "🚀 ~ file: page.js:65 ~ Home ~ checkWinningsAmount:",
    checkWinningsAmount
  );

  const { data: ticketPrice } = useContractRead(contract, "ticketPrice");
  if (ticketPrice) {
    console.log(
      "🚀 ~ file: page.js:71 ~ Home ~ ticketPrice:",
      ticketPrice.toString()
    );
  }
  const { data: ticketToken } = useContractRead(contract, "ticketToken");
  console.log("🚀 ~ file: page.js:73 ~ Home ~ ticketToken:", ticketToken);
  const { data: commissionTicket } = useContractRead(
    contract,
    "commissionPercent"
  );
  console.log(
    "🚀 ~ file: page.js:75 ~ Home ~ commissionTicket:",
    commissionTicket
  );

  const { data: expiration } = useContractRead(contract, "expiration");
  console.log("🚀 ~ file: page.js:80 ~ Home ~ expiration:", expiration);
  const { data: tickets } = useContractRead(contract, "getTickets");
  console.log("🚀 ~ file: page.js:82 ~ Home ~ tickets:", tickets);

  const { data: lotteryId } = useContractRead(contract, "lotteryId");
  console.log("🚀 ~ file: page.js:88 ~ Home ~ lotteryId:", lotteryId);
  const { data: lotteryCount } = useContractRead(contract, "lotteryCount");
  console.log("🚀 ~ file: page.js:90 ~ Home ~ lotteryCount:", lotteryCount);

  const { data: hasWinnerClaimed } = useContractRead(
    contract,
    "hasWinnerClaimed",
    address
  );
  console.log(
    "🚀 ~ file: page.js:136 ~ Home ~ hasWinnerClaimed:",
    hasWinnerClaimed
  );

  const { data: lotteryDataDetails } = useContractRead(
    contract,
    "lotteryDataDetails",
    [1]
  );
  console.log(
    "🚀 ~ file: page.js:85 ~ Home ~ lotteryDataDetails:",
    lotteryDataDetails
  );

  const { data: allow } = useContractRead(tokenContract, "allowance", [
    address,
    process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS,
  ]);

  // const ticketNumberQuantity = Number(ethers.utils.formatEther(ticketPrice.toString())) * quantity

  const { mutateAsync: BuyTickets } = useContractWrite(contract, "BuyTickets");
  const { mutateAsync: approve } = useContractWrite(tokenContract, "approve");
  const { mutateAsync: withdrawWinnings } = useContractWrite(
    contract,
    "WithdrawWinnings"
  );

  const callApprove = async () => {
    try {
      const spendAmount = quantity * 10000000;
      const approveData = await approve({
        args: [process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS, spendAmount],
      });
    } catch (e) {
      console.log("contract call failure", e);
    }
  };

  const handleClick = async () => {
    if (!ticketPrice) return;
    const notification = toast.loading("Buying your tickets");
    try {
      if (tokenBalanceBal < quantity * 10000000) {
        alert(`Insufficient $CHANCE to buy ${quantity} tickets`);
        toast.error(`Insufficient $CHANCE to buy ${quantity} tickets`, {
          id: notification,
        });
      } else {
        try {
          if (
            allow.toString() === "0" ||
            allow.toString() < quantity * 10000000
          ) {
            try {
              const spendAmount = quantity * 10000000;
              const approveData = await approve({
                args: [
                  process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS,
                  spendAmount,
                ],
              });
              console.log(
                "🚀 ~ file: page.js:182 ~ handleClick ~ approveData:",
                approveData
              );
              toast.success(`approved successfully`, {
                id: notification,
              });
            } catch (e) {
              toast.error(`Whoops something went wrong approving`, {
                id: notification,
              });
              console.log("contract call failure", e);
            }
          } else {
            try {
              const buy = await contract?.call("BuyTickets", [quantity]);
              toast.success(`${quantity} tickets purchased successfully`, {
                id: notification,
              });
              console.log("buyTickets data", buy);
            } catch (e) {
              toast.error(`Whoops something went wrong while buying`, {
                id: notification,
              });
              console.info("buyTicket error", e);
            }
          }
        } catch (e) {
          console.info("🚀 ~ file: page.js:171 ~ handleClick ~ e:", e);
        }
      }
    } catch (err) {
      const error = err.message;
      console.info("error error", error);
      toast.error(`Whoops something went wrong`, {
        id: notification,
      });
      console.info("contract call failure", err);
    }

    // try {
    //   const data = await BuyTickets({ args: [1] });
    //   console.info("contract call successs", data);
    // } catch (err) {
    //   console.error("contract call failure", err);
    // }
  };

  const onWithdrawWinnings = async () => {
    const notification = toast.loading("Withdrawing winnings...");
    try {
      const data = await withdrawWinnings([{}]);

      toast.success("Winnings withdraw successfully!", {
        id: notification,
      });
    } catch (err) {
      toast.error("Whoops something went wrong!", {
        id: notification,
      });
      console.error("contract call failure", err);
    }
  };

  const handleTicketNumber = (event) => {
    const limit = 2;
    if (event.target.value > 20) {
      setQuantity("20");
    } else {
      setQuantity(event.target.value.slice(0, limit));
    }
  };

  async function networkCheck() {
    if (isMismatched) {
      switchChain(Binance.chainId);
    }
  }

  async function data() {
    let id = lotteryId.toString() - 1;
    const data = await contract?.call("lotteryDataDetails", [id]);
    setLotteryData(data);
    console.log("🚀 ~ file: page.js:130 ~ data ~ data:", data);
  }

  useEffect(() => {
    if (lotteryId) {
      data();
    }
  }, [address, lotteryId, contract]);

  useEffect(() => {
    networkCheck();
  }, [address, contract]);

  useEffect(() => {
    async function call() {
      try {
        const da = await tokenContract?.call("allowance", [
          address,
          process.env.NEXT_PUBLIC_LOTTERY_CONTRACT_ADDRESS,
        ]);
        console.log("🚀 ~ file: page.js:193 ~ call ~ da:", da);
        setAllowance(da);
      } catch (e) {
        console.error(e);
      }
    }
    call();
  }, [address]);

  useEffect(() => {
    if (!tickets) return;

    if (!ticketPrice) return;
    const FP = ethers.utils.formatEther(ticketPrice, tokenDecimal);

    setFormattedPrice(FP);

    const totalTickets = tickets;
    const noOfUserTickets = totalTickets.reduce(
      (total, ticketAddress) => (ticketAddress === address ? total + 1 : total),
      0
    );
    setUserTickets(noOfUserTickets);
  }, [tickets, address, quantity, ticketPrice]);

  useEffect(() => {
    fetch(
      "https://deep-index.moralis.io/api/v2/erc20/0xb2f664c995B913D598A338C021311B5751dEde0A/price?chain=bsc",
      {
        headers: {
          "X-API-Key":
            "cqHhtltaU6GF4MVFpkTdAm2aibChMQNyVhKLrprbx5qDJvHGV51f3LxDSvhII4AE",
          "Content-Type": "application/json",
        },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("dataFetch", data);
        setChancePrice(data);
      })
      .catch((err) => {
        console.log(err.message);
      });
  }, []);

  const renderer = ({ hours, minutes, seconds, completed }) => {
    if (completed) {
      // return <span>00:00:00</span>
      return (
        <>
          <div className="text-4xl md:text-6xl font-semibold mx-12 text-center">
            {" "}
            Ticket Sales are CLOSED for this draw{" "}
          </div>
        </>
      );
    } else {
      return (
        <>
          <div className="text-4xl md:text-6xl font-semibold">
            {" "}
            Get your tickets now!{" "}
          </div>
          <div className="flex my-8 text-4xl md:text-6xl font-semibold">
            <div className="flex">
              <div className="violet-txt">{hours}</div>
              <div>h</div>
            </div>
            <div className="flex ml-6">
              <div className="violet-txt">{minutes}</div>
              <div>m</div>
            </div>
            <div className="flex ml-6">
              <div className="violet-txt">{seconds}</div>
              <div>s</div>
            </div>
          </div>
          <div className="text-xl">Until the draw</div>
        </>
      );
    }
  };

  return (
    <main className=" min-h-screen w-full overflow-x-hidden relative">
      <div className="decoration-1 " />
      <div className="decoration-2 " />
      {/* <div className="decoration-3 " /> */}
      <div className="decoration-4 " />
      <div className="decoration-5 " />
      {/* <div className="decoration-6 " /> */}

      <div className=" md:px-24 py-4 flex justify-between border-b-2">
        <div></div>
        <div className="flex gap-4 ">
          <Image src="wallet-icon.svg" alt="" width="40" height="32"></Image>
          {/* {connectionStatus === "disconnected" ? (
            <>
              <button
                onClick={connectWithMetamask}
                className="connect-btn-bg px-6 rounded-lg">
                Connect Wallet
              </button>
            </>
          ) : (
            <>
              <button
                onClick={disconnect}
                className="connect-btn-bg px-6 rounded-lg">
                Disconnect
              </button>
            </>
          )} */}
          <ConnectWallet />
        </div>
      </div>

      <div className="flex flex-col items-center mt-16 ">
        <div className="text-4xl md:text-6xl font-semibold">
          {" "}
          Chance Lottery{" "}
        </div>
        <div className="mt-8 violet-txt text-4xl md:text-6xl">
          {pricePool == 0 ? (
            <>No Price Pot Yet</>
          ) : (
            <>
              {/* {pricePool &&
                      Number(
                        ethers.utils.formatEther(pricePool.toString()) *
                          chancePrice?.usdPriceFormatted
                      ).toFixed(2)}{" "} */}
              {pricePool && Number(pricePool).toLocaleString()} {tokenSymbol}
              <br></br>
              {/* {"$"}
                    {pricePool &&
                      (
                        pricePool.toString() * chancePrice?.usdPriceFormatted
                      ).toFixed(2)}
                    {""} */}
            </>
          )}
        </div>
        {/* <div className="mt-8">In Prizes!</div> */}
        <button
          onClick={handleClick}
          disabled={
            expiration?.toString() < Date.now().toString() ||
            remainingTickets?.toNumber() == 0 ||
            userTickets == 20 ||
            !address
          }
          className=" text-xl my-24 px-14 py-2 rounded-3xl border-buy ">
          {/* {expiration?.toString() < Date.now().toString() ? (
            <>Ticket Sale CLOSED</>
          ) : (
              <> */}
          {address ? "Buy Tickets" : "Connect Wallet to Buy Ticket"}
          {/* </>
          )} */}
        </button>
      </div>

      <div className="flex flex-col items-center">
        <div className="text-4xl font-semibold">How to Play</div>
        <div className="w-8/12  md:w-5/12 text-xl mt-6 text-center subtitle">
          If the digits on your ticket match the winning numbers in the correct
          order, you win 80% of the prize pool. Simple!
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-0 justify-around px-12 md:px-24 mt-16 ">
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 connect-btn-bg rounded-3xl flex items-center justify-center">
            <Image src="buy_ticket.svg" alt="" width="20" height="20"></Image>
          </div>
          <div className="text-xl font-semibold py-2.5">Buy Tickets</div>
          <div className="text-center subtitle">
            After connecting MetaMask, simply click on buy and sign the message.
            A ticket with 3 randomly generated digit will be given to you.
          </div>
        </div>
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 connect-btn-bg rounded-3xl flex items-center justify-center">
            <Image
              src="wait_for_draw.svg"
              alt=""
              width="20"
              height="20"></Image>
          </div>
          <div className="text-xl font-semibold py-2.5">Wait for the draw</div>
          <div className="text-center subtitle">
            Once you have the ticket, all you have to do is wait for the winning
            number to be announced.
          </div>
        </div>
        <div className="flex flex-col items-center flex-1">
          <div className="w-10 h-10 connect-btn-bg rounded-3xl flex items-center justify-center">
            <Image
              src="check_for_prizes.svg"
              alt=""
              width="20"
              height="20"></Image>
          </div>
          <div className="text-xl font-semibold py-2.5">Check for prizes</div>
          <div className="text-center subtitle">
            Winner is chosen on a daily basis and the draws will reset.
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center mt-24 ">
        <Countdown date={new Date(expiration * 1000)} renderer={renderer} />
        {/* <div className="text-4xl md:text-6xl font-semibold">
          {" "}
          Get your tickets now!{" "}
        </div>
        <div className="flex my-8 text-4xl md:text-6xl font-semibold">
          <div className="flex">
            <div className="violet-txt">4</div>
            <div>d</div>
          </div>
          <div className="flex ml-6">
            <div className="violet-txt">9</div>
            <div>h</div>
          </div>
          <div className="flex ml-6">
            <div className="violet-txt">23</div>
            <div>min</div>
          </div>
        </div>
        <div className="text-xl">Until the draw</div> */}

        <div className=" mx-12 md:mx-24 border-bg  p-3 mt-16 md:w-1/2">
          <div className="flex flex-col  ">
            <div className="flex justify-between ">
              <div className="text-xs md:text-xl">Ticket Price</div>
              <div className="text-xs md:text-xl">
                {/* {ticketNumberQuantity} {tokenSymbol} */}
                {ticketPrice &&
                  Number(formattedPrice * quantity).toLocaleString()}{" "}
                {tokenSymbol}
              </div>
            </div>
            {/* <div className="flex justify-between ">
              <div className="text-xs md:text-xl"></div>
              <div className="text-xs md:text-sm">
                {"$"}
                {(ticketPrice &&
                  ticketPrice.toString() *
                    quantity *
                    chancePrice?.usdPriceFormatted).toFixed(2)}{" "}
              </div>
            </div> */}
            <hr className="h-px my-4 border-0 bg-gray-700"></hr>
            <div className=" flex flex-col items-center">
              <div className="font-semibold  text-4xl md:text-4xl">
                Prize Pot
              </div>
              <div className="font-semibold items-center text-center mt-8 violet-txt text-4xl">
                {" "}
                {pricePool == 0 ? (
                  <>No Price Pot Yet</>
                ) : (
                  <>
                    {pricePool && Number(pricePool).toLocaleString()}{" "}
                    {tokenSymbol}
                    <br></br>
                    {/* {"$"}
                    {pricePool &&
                      (
                        pricePool.toString() * chancePrice?.usdPriceFormatted
                      ).toFixed(2)}
                    {""} */}
                  </>
                )}
              </div>
              <br></br>
              <span className="font-semibold text-l">
                Tickets Available: {remainingTickets?.toNumber()}
              </span>
              {/* <div className="mt-8 text-lg"> 20,554 stars</div> */}
              <input
                type="number"
                disabled={!address}
                className="bg-gray-600 rounded-lg px-2 placeholder-white outline-none py-1 mt-8"
                placeholder="Input number of ticket"
                min={1}
                max={ticketUserCanBuy}
                value={quantity}
                onChange={handleTicketNumber}></input>
              {userTickets == 20 ? (
                <>
                  <button
                    onClick={handleClick}
                    disabled
                    className=" text-2xl my-8 px-14 py-2 rounded-3xl border-buy">
                    Can`t buy more 20 ticket
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleClick}
                    disabled={
                      expiration?.toString() < Date.now().toString() ||
                      remainingTickets?.toNumber() == 0 ||
                      userTickets == 20 ||
                      !address
                    }
                    className=" text-l my-8 px-14 py-2 rounded-3xl border-buy">
                    {expiration?.toString() < Date.now().toString() ? (
                      <>Ticket Sale CLOSED</>
                    ) : (
                      <>
                        {address
                          ? `Buy ${quantity} Tickets`
                          : "Connect Wallet to Buy Ticket"}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <br />
      <br />

      <Marquee className="bg-[#000000] p-5 mb-5" gradient={false} speed={100}>
        {lotteryData && lotteryData ? (
          <div className="flex space-x-2 mx-18">
            <h4 className="text-white font-bold">
              Last Winner: {lotteryData.lastWinner?.substring(0, 5)}...
              {lotteryData.lastWinner?.substring(
                lotteryData.lastWinner.length,
                lotteryData.lastWinner.length - 5
              )}
            </h4>
            <h4 className="text-white font-bold">
              Last Winnings:{" "}
              {Number(lotteryData.lastWinnerAmount.toString()).toLocaleString()}{" "}
              {tokenSymbol}
            </h4>
          </div>
        ) : (
          <></>
        )}
      </Marquee>

      <div className="flex flex-col items-center mt-16">
        <div className="font-semibold text-4xl md:text-6xl">
          Finished Rounds
        </div>
        <div className="flex justify-center bg-white p-1 my-6 rounded-md">
          <button
            onClick={() => setHistory((previousValue) => (previousValue = 0))}
            className={` px-10 rounded-lg ${
              historyValue == 0 ? "connect-btn-bg" : "text-black"
            }`}>
            Current Round
          </button>
          <button
            onClick={() => setHistory((previousValue) => (previousValue = 1))}
            className={` px-10 rounded-lg ${
              historyValue == 1 ? "connect-btn-bg" : "text-black"
            }`}>
            History
          </button>
        </div>
        {historyValue == 0 ? (
          <div className=" mx-12 md:mx-24 border-bg  p-3  mt-16 md:w-1/2 ">
            <div className="flex flex-col  ">
              <div className="flex justify-between items-center">
                <div className="flex  flex-col">
                  <div className="flex items-center ">
                    <div className="font-semibold text-2xl">Round</div>
                    <div className="ml-3 w-10 h-10 connect-btn-bg rounded-3xl flex items-center justify-center">
                      {lotteryId && lotteryId.toString()}
                    </div>
                  </div>
                  {/* <div className="mt-2 subtitle">Drawn Nov 12, 2022, 4:30pm </div> */}
                </div>
                {/* <div className="text-xl">TODO: Find pagination library</div> */}
              </div>
              <hr className="h-px my-4 border-0 bg-gray-700"></hr>
              <div className="flex flex-col md:flex-row items-center justify-around">
                <div className="font-semibold text-2xl mb-2 md:mb-0">
                  Tickets
                </div>
                <div className="flex">
                  {userTickets > 0 ? (
                    <>
                      {Array(userTickets)
                        .fill("")
                        .map((_, index) => (
                          <div
                            key={index}
                            className="ml-3 w-10 h-10 connect-btn-bg rounded-3xl flex items-center justify-center">
                            {index + 1}
                          </div>
                        ))}
                    </>
                  ) : (
                    <>No ticket</>
                  )}
                </div>
              </div>
              <hr className="h-px my-4 border-0 bg-gray-700"></hr>
              {/* <div className="grid grid-cols-3 justify-items-center">
              <div className="flex flex-col  justify-start">
                <div className="text-lg font-semibold">Gold</div>
                <div className="text-lg font-semibold violet-txt">
                  0.070 BNB
                </div>
                <div className="text-lg font-semibold">$20</div>
              </div>
              <div className="flex flex-col justify-start">
                <div className="text-lg font-semibold">Silver</div>
                <div className="text-lg font-semibold violet-txt">
                  0.035 BNB
                </div>
                <div className="text-lg font-semibold">$10</div>
              </div>
              <div className="flex flex-col  justify-start">
                <div className="text-lg font-semibold">Bronze</div>
                <div className="text-lg font-semibold violet-txt">
                  0.018 BNB
                </div>
                <div className="text-lg font-semibold">$5</div>
              </div>
            </div>
            <div className="flex justify-center gap-2 items-center my-3">
              <div>Hide</div>
              <Image src="arrow-up.svg" alt="" width="10" height="5"></Image>
            </div> */}
            </div>
          </div>
        ) : (
          <div className=" mx-12 md:mx-24 border-bg  p-3  mt-16 md:w-1/2 flex flex-col ">
            <div className="text-lg font-semibold mx-auto">
              Last Round Details
            </div>
            {/* {userTransactions.length ? (
              <div className="mb-3">TODO: Find pagination library</div>
            ) : (
              <div></div>
            )} */}
            {lotteryData && lotteryData ? (
              <div className="flex flex-col">
                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center">
                    <div>Round</div>
                    <div
                      className="
                        ml-3 w-10 h-10 connect-btn-bg rounded-3xl flex items-center justify-center">
                      {lotteryId.toString() - 1}
                    </div>
                  </div>
                  <div> </div>
                </div>
                <div className="mt-3 flex justify-between">
                  <div> Winning Amount </div>
                  <div>
                    {" "}
                    {/* {ethers.utils.formatEther(
                      lotteryData.lastWinnerAmount.toString(), tokenDecimal
                    )}{" "} */}
                    {Number(
                      lotteryData.lastWinnerAmount.toString()
                    ).toLocaleString()}{" "}
                    {tokenSymbol}
                    {/* {lotteryData.lastWinnerAmount.toString()}{" "} */}
                  </div>
                </div>
                {address ? (
                  <>
                    {lotteryData.lastWinner === address ? (
                      <>
                        {hasWinnerClaimed && hasWinnerClaimed === false ? (
                          <>
                            <button
                              onClick={onWithdrawWinnings}
                              className=" w-fit mx-auto px-6 py-2 rounded-3xl border-buy mt-2">
                              Claim Prizes
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              disabled
                              className=" w-fit mx-auto px-6 py-2 rounded-3xl border-buy mt-2">
                              Winnings Claimed 😜
                            </button>
                          </>
                        )}
                      </>
                    ) : (
                      <button
                        disabled
                        className=" w-fit mx-auto px-6 py-2 rounded-3xl border-buy mt-2">
                        You were not the winner, try again
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    disabled
                    className=" w-fit mx-auto px-6 py-2 rounded-3xl border-buy mt-2">
                    Please Connect your wallet
                  </button>
                )}

                <hr className="h-px my-4 border-0 bg-gray-700"></hr>
              </div>
            ) : (
              <div className="my-2">No recent transactions</div>
            )}
          </div>
        )}
      </div>

      <div className="mx-12 md:mx-24 md:grid md:grid-cols-12 mt-16 justify-items-center items-center ">
        {/* <div className="col-span-7 flex flex-col gap-3">
          <div className="text-2xl font-semibold">Winning Criteria</div>
          <div className="violet-txt font-semibold text-2xl">
            The digits on your ticket must match in the correct order to win.
          </div>
          <div>Here’s an example lottery draw, with two tickets, A and B.</div>
          <div>
            Ticket A: The first 3 digits and the last 2 digits match, but the
            4th digit is wrong, so this ticket only wins a “Match first 3”
            prize.
          </div>
          <div>
            Ticket B: Even though the last 5 digits match, the first digit is
            wrong, so this ticket doesn’t win a prize.
          </div>
          <div>
            Prize brackets don’t ‘stack’: if you match the first 3 digits in
            order, you’ll only win prizes from the ‘Match 3’ bracket, and not
            from ‘Match 1’ and ‘Match 2’.
          </div>
        </div> */}

        {/* <Image
          src="winning_criteria_1.svg"
          alt=""
          className="col-span-5 mx-auto"
          width={400}
          height={273}></Image> */}
      </div>

      <div className="mx-12 md:mx-24   md:grid md:grid-cols-12  mt-16 justify-items-center items-center mb-24">
        {/* <div className="col-span-7 flex flex-col gap-3">
          <div className="text-2xl font-semibold">Prize Funds</div>
          <div className="subtitle">
            The prizes for each lottery round come from three sources:
          </div>
          <div className="text-2xl font-semibold">$20 Gold</div>
          <div className="subtitle">
            100% of the BNB paid by people buying tickets that round goes back
            into the prize pools.
          </div>
          <div className="text-2xl font-semibold">$10 Silver</div>
          <div className="subtitle">
            After every round, if nobody wins in one of the prize brackets, the
            unclaimed BNB for that bracket rolls over into the next round and
            are redistributed among the prize pools.
          </div>
          <div className="text-2xl font-semibold">$5 Bronze</div>
          <div className="subtitle">
            An average total of 35,000 BNB from the treasury is added to lottery
            rounds over the course of a week. This BNB is of course also
            included in rollovers! Read more in our guide to BNB Tokenomics
          </div>
        </div>

        <Image
          src="winning_criteria_2.svg"
          alt=""
          className="col-span-5 mx-auto "
          width={400}
          height={350}></Image> */}
      </div>

      <div className="footer-bg px-12 md:px-24 py-16 flex flex-wrap justify-items-center gap-3">
        <div className="flex flex-1 flex-col">
          <Image src="/chance.jpeg" alt="" width="88" height="88"></Image>
          <div className="subtitle text-sm mt-6">
            Copyright © 2022 Chance Lottery.
          </div>
          <div className="subtitle text-sm mt-2">All rights reserved</div>
          <div className="flex gap-3 mt-4 flex-wrap">
            <a href="https://t.me/chancebsc" target="_blank">
              <Image src="/telegram.svg" alt="" width="18" height="18"></Image>
            </a>
            <a href="https://discord.com/invite/chancebsc" target="_blank">
              <Image src="/discord.svg" alt="" width="18" height="18"></Image>
            </a>
            <a href="https://twitter.com/chancebsc" target="_blank">
              <Image src="/twitter.svg" alt="" width="18" height="18"></Image>
            </a>
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-4 justify-center mt-12">
          <a
            className="font-semibold text-lg"
            href="https://whitepaper.chancebsc.com"
            target="_blank">
            Whitepaper
          </a>
          <a
            className="font-semibold text-lg"
            href="https://pancakeswap.finance/swap?outputCurrency=0xb2f664c995B913D598A338C021311B5751dEde0A"
            target="_blank">
            Swap
          </a>
          <a
            className="font-semibold text-lg"
            href="https://bscscan.com/address/0xb2f664c995B913D598A338C021311B5751dEde0A"
            target="_blank">
            Contract Address
          </a>
        </div>

        {/*  <div className="flex flex-[2] flex-col">
          <div className="font-semibold text-lg mb-6">Stay up to date</div>
          <div className="flex">
            <input
              type="text"
              className="bg-gray-600 rounded-lg px-2 placeholder-white outline-none py-1"
              placeholder="Your email address"></input>
          </div>
        </div> */}
      </div>
    </main>
  );
}
