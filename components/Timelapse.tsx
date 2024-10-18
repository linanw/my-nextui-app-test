'use client'

import { useEffect, useState } from "react";

const Timelapse = (props: { camId: string, speedTimes?: number, hidden?: boolean }) => {

    const [currentIntervalId, setCurrentIntervalId] = useState(0);
    const [currentInterval, setCurrentInterval] = useState(0);
    const [requestImageListFailed, setRequestImageListFailed] = useState(false);
    const [imageFound, setImageFound] = useState(0);
    const [images_list, setImagesList] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [indexOverride, setIndexOverride] = useState(-1);
    const [preloadImageAmout, setPreloadImageAmout] = useState(0);
    const [isPreloading, setIsPreloading] = useState(false);
    const times = props.speedTimes ?? 1000; // default 3000 times faster
    const interval = (1000 * 60 * 5) / times;  // 5 minutes = 1000*60*5, 3000 times faster

    const preloadImages = (array: string[]) => {
        for (var i = 0; i < array.length; i++) {
            var img = document.createElement("img");
            img.onload = function () {
                setPreloadImageAmout(state => state + 1);
            }
            img.src = array[i];
            img.alt = "preload";
        }
    }

    const loadImageList = async () => {
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        const raw = JSON.stringify({
            "expression": "resource_type=image AND uploaded_at>24h AND asset_folder=timelapse AND type=upload",
            "sort_by": [
                {
                    "created_at": "desc"
                }
            ],
            "fields": [
                "secure_url"
            ],
            "max_results": 500
        });

        const response = await fetch("/cld/v1_1/dn9rloq0x/resources/search", {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        });

        if (!response.ok) {
            console.log("response not ok");
            return;
        }
        const json = await response.json();
        // check if json has resources
        if (json.error) {
            console.log("Error:", json.error.message);
            setRequestImageListFailed(true);
            return;
        }
        json.resources.forEach((element: { secure_url: string; }) => {
            setImagesList(state => [...state, element.secure_url.replace("image/upload", "image/upload/h_360")]);
        }
        );
        setImageFound(json.resources.length);
    }

    useEffect(() => {
        if (imageFound == 0 && !requestImageListFailed) {
            loadImageList();
        };

        if (!isPreloading && imageFound != 0 && images_list.length == imageFound) {
            preloadImages(images_list);
            setIsPreloading(true);
        }
    }, [imageFound, requestImageListFailed]);

    useEffect(() => {
        if (images_list.length != 0 && preloadImageAmout >= images_list.length * 0.6) {
            if (currentIntervalId != 0) {
                console.log("*********clear interval", currentIntervalId);
                clearInterval(currentIntervalId);
            }
            if (!props.hidden) {
                console.log("******set interval", interval);
                const intervalID = setInterval(() => {
                    setCurrentIndex(state => (state + 1) % images_list.length);
                }, interval);
                console.log("******set intervalID", intervalID);
                setCurrentIntervalId(intervalID as unknown as number); // linanw: if here is a type error, please ignore it, it's not valid.
                setCurrentInterval(interval);
            }
        }
    }, [props.speedTimes, preloadImageAmout, props.hidden]
    );

    const isImagePreloadEnough = () => (preloadImageAmout >= images_list.length * 0.6);

    return (<div className="container" hidden={props.hidden ?? false}>
        <img
            draggable="false"
            onContextMenu={(event) => {
                event.preventDefault();
                return false;
            }}
            onTouchStart={() => setIndexOverride(0)}
            onTouchMove={(event) => {
                const screenWidth = window.innerWidth;
                const touchX = event.touches[0].clientX;
                const touchControlAreaPercentage = 0.7;
                var newIndex = Math.floor(((touchX - screenWidth * (1 - touchControlAreaPercentage) / 2) / screenWidth / touchControlAreaPercentage) * images_list.length);
                if (newIndex < 0) newIndex = 0;
                if (newIndex >= images_list.length) newIndex = images_list.length - 1;
                setIndexOverride(images_list.length - 1 - newIndex);

            }}
            onTouchEnd={() => setIndexOverride(-1)}
            width="100%"
            height="100%"
            src={
                indexOverride != -1
                    ? images_list[indexOverride]
                    : isImagePreloadEnough() ? images_list[images_list.length - 1 - currentIndex] : images_list[0]
            }
            sizes="100vw"
            alt="Timelapse"
        />
        <div className="bottom-right"> Image: {imageFound}, Preload: {images_list.length == 0 ? 0 : Math.floor((preloadImageAmout / images_list.length) * 100)}%
            Speed: {times}x</div></div>)
}

export default Timelapse;
