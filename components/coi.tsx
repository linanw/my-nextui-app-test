"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@nextui-org/button";

export const COI = (props: {className?: string}) => {
    const [coi, setCOI] = useState(false);

    useEffect (() => {
        setCOI(crossOriginIsolated);
    }
    );
    return (
        <div className={props.className}>
      {coi ? "✅" : "❌"}
      </div>
  );
};
