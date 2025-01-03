"use client";

import { CSSProperties, use, useEffect, useRef, useState } from "react";
import ZoomVideo, {
  type VideoClient,
} from "@zoom/videosdk";
import { FileX2, PhoneOff } from "lucide-react";
import { Button } from "@nextui-org/button";
import { COI } from "./coi";
import { CamPanel, VideoPanelMode } from "./CamPanel";

const maxNumberOfCamPanels = 8;
const maxZoomMultiplier = 3;

// linanw, use "async" here will have error.
const Videocall = (props: { session_name: string; JWT: string }) => {
  const [suggestedMode, setSuggestedMode] = useState(VideoPanelMode.Stream);
  const session_name = props.session_name;
  console.log("session_name: ", session_name);
  const jwt = props.JWT;
  const client = useRef<typeof VideoClient>(ZoomVideo.createClient());
  const camPanelDefaultHeight = 360;
  const [session, setSession] = useState(undefined);
  const [camIdList, setCamIdList] = useState<string[]>(["pty-lct-law-pan-5_cam0", "pty-lct-law-pan-5_cam1", "default_cam0", "default_cam1", "default_cam2", "default_cam3",
    "default_cam4", "default_cam5", "default_cam6", "default_cam7"]);
  const [currentTimeoutId, setCurrentTimeoutId] = useState<number>(0);
  const [zoomMultiplier, setZoomMultiplier] = useState(0);
  const [canvasOffset, setCanvasOffset] = useState(0);
  const [page, setPage] = useState(0);

  const videoPlayerContainer = useRef<HTMLDivElement>(null);
  const zoomMultiplierRef = useRef(zoomMultiplier);
  const pageRef = useRef(page);
  zoomMultiplierRef.current = zoomMultiplier;
  pageRef.current = page;

  const joinSession = async () => {
    console.log("joinSession");
    await client.current.init("en-US", "Global", { patchJsMedia: true, enforceMultipleVideos: { disableRenderLimits: true } }); 
    const result: any = await client.current.join(session_name, jwt, userName, "0000").catch((e) => {
      console.log("***" + JSON.stringify(e) + "***");
    });
    result && console.log("######*********** join result: ", result);
    setSession(result);
  };

  const sendCommand = async (command: string) => {
    await client.current.getCommandClient().send(command);
  }

  const leaveSession = async () => {
    await client.current.leave().catch((e) => console.log("leave error", e));
    // hard refresh to clear the state
    // window.location.href = "/";
  };

  useEffect(() => {
    const shuffle = (array: string[]) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    // setCamIdList(shuffle(camIdList));

    // schedule a timer to refresh the page at 00:00
    if (currentTimeoutId !== 0) {
      clearTimeout(currentTimeoutId);
    }
    const now = new Date();
    var millisTill00 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime() - now.getTime();
    if (millisTill00 < 0) {
      millisTill00 += 86400000; // it's after 00:00, try 00:00 tomorrow.
    }
    const timeoutId = setTimeout(function () {
      window.location.reload();
    }, millisTill00);

    const keyboardZoomHandler = (event: KeyboardEvent) => {
      console.log("********* key code: ", event.code);
      const Height = videoPlayerContainer.current?.getBoundingClientRect().height ?? 0;
      const winHeight = window.innerHeight;
      const maxPage = Math.ceil(Height / winHeight) - 1;
      if ((event.key === '+' || event.key === '=')) {
        event.preventDefault();
        zoomMultiplierRef.current == 0 ? setZoomMultiplier(findBiggestMultipler(camPanelDefaultHeight, innerHeight)) : zoomMultiplierRef.current > 1 && setZoomMultiplier(zoomMultiplierRef.current - 1);
      } else if (event.key === '-') {
        event.preventDefault();
        zoomMultiplierRef.current == 0 ? setZoomMultiplier(findBiggestMultipler(camPanelDefaultHeight, innerHeight)) : zoomMultiplierRef.current < maxZoomMultiplier && setZoomMultiplier(zoomMultiplierRef.current + 1);
      } else if (event.key === '0') {
        event.preventDefault();
        setZoomMultiplier(0);
      } else if (event.key === '1' || event.key === '2' || event.key === '3' || event.key === '4' || event.key === '5' || event.key === '6') {
        event.preventDefault();
        setZoomMultiplier(parseInt(event.key) <= maxZoomMultiplier ? parseInt(event.key) : maxZoomMultiplier);
      } else if (event.code === 'PageDown' || event.code === 'ArrowDown' || event.code === 'ArrowRight') {
        event.preventDefault();
        if (pageRef.current > maxPage) setPage(maxPage);
        else if (pageRef.current < maxPage) setPage(pageRef.current + 1);
      } else if (event.code === 'PageUp' || event.code === 'ArrowUp' || event.code === 'ArrowLeft') {
        event.preventDefault();
        if (pageRef.current < 0) setPage(0);
        else if (pageRef.current > 0) setPage(pageRef.current - 1);
      } else if (event.altKey && event.code === 'Enter') {
        event.preventDefault();
        document.documentElement.requestFullscreen();
      }
    }

    const wheelZoomHandler = (event: WheelEvent) => {
      event.ctrlKey && event.preventDefault();
    }

    setCurrentTimeoutId(timeoutId as unknown as number); // linanw: if here is a type error, please ignore it, it's not valid. 
    document.removeEventListener('keydown', keyboardZoomHandler);
    document.removeEventListener('wheel', wheelZoomHandler);

    console.log("#####*************effect set listener");
    document.addEventListener('keydown', keyboardZoomHandler);
    document.addEventListener('wheel', wheelZoomHandler, { passive: false });

    const element = document.getElementById("a");
    var resizeObserver: ResizeObserver;
    if (element) {
      console.log("**************set resize observer: ", element);
      if (element && element.parentElement) {
        resizeObserver = new ResizeObserver(() => {
          element.parentElement!.scrollTo(0, 0);
          const isFullyVisible = elementIsHeightFitViewport(element);
          isFullyVisible ? element.parentElement!.style.justifyContent = "center" : element.parentElement!.style.justifyContent = "flex-start";
          setPage(0);
        });
        resizeObserver.observe(element);
      }
    }

    session || joinSession();

    return () => {
      console.log("#####*************effect clean up");
      document.removeEventListener('keydown', keyboardZoomHandler);
      document.removeEventListener('wheel', wheelZoomHandler);
      if (element) resizeObserver.unobserve(element);
    }
  }, [props.session_name]);

  useEffect(() => {
    // const top = videoPlayerContainer.current?.getBoundingClientRect().top ?? 0;
    const Height = videoPlayerContainer.current?.getBoundingClientRect().height ?? 0;
    const winHeight = window.innerHeight;
    const maxPage = Math.ceil(Height / winHeight);
    if (page >= 0 && page <= maxPage) {
      setCanvasOffset(page * - winHeight);
    }
  }, [page]);

  const elementIsHeightFitViewport = (el: HTMLElement) => {
    const height = el.getBoundingClientRect().height;
    return height <= innerHeight;
  };

  const findBiggestMultipler = (value: number, ceiling: number): number => {
    let multiplier = 1;
    while (value * multiplier < ceiling) {
      multiplier++;
    }
    return multiplier - 1;
  }

  console.log("zoomMultiplier: ", zoomMultiplier);
  console.log("zoomMultiplierRef: ", zoomMultiplierRef.current);
  document.body.style.overflow = "hidden";
  console.log("############ page: ", page, "canvasOffset: ", canvasOffset);

  return (
    <>
      <div className="" >
        {/* <COI className="bottom-right" /> */}
        {/* <h1 className="text-center text-3xl font-bold mb-4 mt-0 top-left">
          Session: {session}+
        </h1> */}
        <div className="flex h-screen flex-col justify-center bg-black" >
          {/* @ts-expect-error html component */}
          <video-player-container id="a" style={{ top: `${canvasOffset}px` }} ref={videoPlayerContainer}>
            <div className="flex flex-row  justify-center  flex-wrap" id="b" >
              {camIdList.slice(0, maxNumberOfCamPanels).map((camId, index) => (
                <CamPanel className="cam-panel" key={index} videoClient={client} mode={suggestedMode} camId={camId} page={page} style={{
                  height: zoomMultiplierRef.current === 0 ? `${camPanelDefaultHeight}px` : `${innerHeight / zoomMultiplierRef.current}px`
                }} />
              ))}
            </div>
            {/* @ts-expect-error html component */}
          </video-player-container>
        </div>


        <div className="flex w-full flex-col justify-center self-center">
          <div className="mt-4 flex w-[30rem] flex-1 justify-around self-center rounded-md bg-white p-4">
            <Button onClick={leaveSession} title="leave session">
              <PhoneOff />
            </Button>
            <Button onClick={() => sendCommand("#l")} title="send command">
              Send Command
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Videocall;

const videoPlayerStyle = {
  backgroundColor: "black",
  // height: "100vh",
  // width: "100vw",
  marginTop: "0rem",
  marginLeft: "0rem",
  marginRight: "0rem",
  alignContent: "center",
  borderRadius: "0px",
  overflow: "hidden",
} as CSSProperties;

const userName = `User-${new Date().getTime().toString().slice(8)}`;