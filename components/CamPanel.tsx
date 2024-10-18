import { MutableRefObject, use, useEffect, useRef, useState } from "react";
import Timelapse from "./Timelapse";
import ZoomVideo, {
    VideoClient,
    VideoQuality,
    type VideoPlayer,
} from "@zoom/videosdk";

export enum VideoPanelMode {
    Stream = 'stream',
    Timelapse = 'timelapse',
    Static = 'static',
}

export const CamPanel = (props: {
    videoClient: MutableRefObject<typeof VideoClient>,
    camId: string,
    mode?: VideoPanelMode,
    className?: string,
    onControlCommand?: () => void,
}) => {
    console.log("*************init, camId", props.camId);
    const client = props.videoClient;
    const mediaStream = client.current.getMediaStream();
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState<VideoPanelMode>(props.mode ?? VideoPanelMode.Stream);

    useEffect(() => {
        console.log("###############*************useEffect, camId", props.camId);
        client.current.on("peer-video-state-change", async (payload) => {
            const action = payload.action;
            const userId = payload.userId;
            const camId = client.current.getUser(userId)?.displayName;
            if (action === "Start") {
                if (camId && camId === props.camId) {
                    console.log("*************camId", camId);
                    const video = await mediaStream.attachVideo(userId, VideoQuality.Video_360P)
                    console.log("*************camId ok", camId);
                    // if (video && videoContainerRef.current) {
                    console.log("*************attach");
                    console.log(video);
                    videoContainerRef.current!.appendChild(video as VideoPlayer);
                    // }
                }
            }
        });
    }, [client, props.camId]);

    // if (props.mode) {
    //     setMode(props.mode);
    // }

    return (
        <div className="container">
            {/* @ts-expect-error html component */}
            <div hidden={mode != VideoPanelMode.Stream}><video-player-container ref={videoContainerRef}
                style={{
                    backgroundImage: `url(${'https://res.cloudinary.com/dn9rloq0x/image/upload/h_360/v1729207508/1729207501_2024-10-18_07-25-01.jpg'})`,
                    backgroundRepeat: `no-repeat`,
                    backgroundSize: `cover`,
                }}>
                <div className="bottom-right"> {props.camId}- Live</div>
                {/* @ts-expect-error html component */}
            </video-player-container></div >
            <Timelapse hidden={mode != VideoPanelMode.Timelapse} camId={""} />
            <img hidden={mode != VideoPanelMode.Static} style={{
                width: '100%',
                height: '100%',
            }}
                src="https://res.cloudinary.com/dn9rloq0x/image/upload/h_360/v1729207508/1729207501_2024-10-18_07-25-01.jpg" alt="static"/>
            <div className="top-right">
                <button onClick={() => setMode(VideoPanelMode.Stream)}>Live</button><br />
                <button onClick={() => setMode(VideoPanelMode.Timelapse)}>Timelapse</button><br />
                <button onClick={() => setMode(VideoPanelMode.Static)}>Static</button>
            </div>
        </div>
    );
}