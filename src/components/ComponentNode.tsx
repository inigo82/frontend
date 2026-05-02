import { round } from "mathjs";
import { useEffect } from "react";
import { NodeProps } from "reactflow";
import { Handle, Position, useUpdateNodeInternals } from "reactflow";

const images: Record<string, string> = {
  V: "/images/fuente.png",
  R: "/images/resistencia.png",
  I: "/images/fuenteCorriente.png",
  GND: "/images/ground.png",
};



export type Orientation = "right" | "down" | "left" | "up";

export type ComponentData = {
  label: string;
  type: "R" | "V" | "I"| "GND";
  orientation: Orientation;
  polarity?: "AtoB" | "BtoA";
  value?: string;
  voltage?: number;
  current?: number;
  solverResult?: {
    voltages: Record<string, number>;
    currents: Record<string, number>;
  };
  showSolverResult?: boolean;
  isConnecting?: boolean;
};

export default function ComponentNode({ id, data }: NodeProps<ComponentData>) {
  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, data.orientation, updateNodeInternals]);

  const rotation: Record<Orientation, string> = {
    right: "0deg",
    down: "90deg",
    left: "180deg",
    up: "270deg",
  };
  

  const isGND = data.type === "GND";

  const horizontal =
    data.orientation === "right" || data.orientation === "left";

  const imageSize = isGND ? 40 : 50;
  const handleSize = 8;
  const handleOffset = imageSize / 2 ;

  const showSolverResult = data.showSolverResult ?? true;

  const voltage = showSolverResult
    ? data.voltage ??
      data.solverResult?.voltages[data.label.split(" ")[0]]
    : undefined;

  const current = showSolverResult
    ? data.current ??
      data.solverResult?.currents[data.label.split(" ")[0]]
    : undefined;

  const voltageRounded =
    voltage !== undefined ? round(voltage, 2) : undefined;
  const currentRounded =
    current !== undefined ? round(current, 2) : undefined;

  const polarity = data.polarity ?? "AtoB";

  let plusPosition: React.CSSProperties = {};
  let minusPosition: React.CSSProperties = {};

  switch (data.orientation) {
    case "right":
      plusPosition = polarity === "AtoB"
        ? { left: -10, top: "50%", transform: "translateY(-50%)" }
        : { right: -10, top: "50%", transform: "translateY(-50%)" };

      minusPosition = polarity === "AtoB"
        ? { right: -10, top: "50%", transform: "translateY(-50%)" }
        : { left: -10, top: "50%", transform: "translateY(-50%)" };
      break;

    case "left":
      plusPosition = polarity === "AtoB"
        ? { right: -10, top: "50%", transform: "translateY(-50%)" }
        : { left: -10, top: "50%", transform: "translateY(-50%)" };

      minusPosition = polarity === "AtoB"
        ? { left: -10, top: "50%", transform: "translateY(-50%)" }
        : { right: -10, top: "50%", transform: "translateY(-50%)" };
      break;

    case "down":
      plusPosition = polarity === "AtoB"
        ? { top: -12, left: "70%", transform: "translateX(-50%)" }
        : { bottom: -12, left: "70%", transform: "translateX(-50%)" };

      minusPosition = polarity === "AtoB"
        ? { bottom: -12, left: "70%", transform: "translateX(-50%)" }
        : { top: -12, left: "70%", transform: "translateX(-50%)" };
      break;

    case "up":
      plusPosition = polarity === "AtoB"
        ? { bottom: -12, left: "70%", transform: "translateX(-50%)" }
        : { top: -12, left: "70%", transform: "translateX(-50%)" };

      minusPosition = polarity === "AtoB"
        ? { top: -12, left: "70%", transform: "translateX(-50%)" }
        : { bottom: -12, left: "70%", transform: "translateX(-50%)" };
      break;
  }

  const valueStyle: React.CSSProperties = horizontal
    ? { top: -20, left: 0, width: "100%", textAlign: "center" }
    : {
        top: 0,
        left: 60,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
      };

  const commonStyle: React.CSSProperties = {
    width: handleSize,
    height: handleSize,
    backgroundColor: "#1f2937",
    borderRadius: "50%",
  };

  const sourceStyle = {
    ...commonStyle,
    zIndex: data.isConnecting ? 1 : 2,
  };

  const targetStyle = {
    ...commonStyle,
    zIndex: data.isConnecting ? 2 : 1,
  };

  return (
    <div
      style={{
        width: 60,
        height: 90,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontSize: 10,
        whiteSpace: "nowrap",
      }}
    >
      {/* RESULTADOS */}
      {!isGND && voltageRounded !== undefined && currentRounded !== undefined && (
        <div
          style={{
            position: "absolute",
            pointerEvents: "none",
            ...valueStyle,
          }}
        >
          <div style={{ color: "green" }}>{voltageRounded} V</div>
          <div style={{ color: "orange" }}>{currentRounded} A</div>
        </div>
      )}

      {/* HANDLES */}
      {!isGND ? (
        horizontal ? (
          <>
            <Handle id="left-source" type="source" position={Position.Left} style={{ ...sourceStyle, top: handleOffset }} />
            <Handle id="left-target" type="target" position={Position.Left} style={{ ...targetStyle, top: handleOffset }} />

            <Handle id="right-source" type="source" position={Position.Right} style={{ ...sourceStyle, top: handleOffset }} />
            <Handle id="right-target" type="target" position={Position.Right} style={{ ...targetStyle, top: handleOffset }} />
            
          </>
        ) : (
          <>
            <Handle id="top-source" type="source" position={Position.Top} style={{ ...sourceStyle }} />
            <Handle id="top-target" type="target" position={Position.Top} style={{ ...targetStyle }} />

            <Handle id="bottom-source" type="source" position={Position.Bottom} style={{ ...sourceStyle }} />
            <Handle id="bottom-target" type="target" position={Position.Bottom} style={{ ...targetStyle }} />
          </>
        )
      ) : (
        // GND SOLO UN TERMINAL 
        <>
          <Handle
            id="top-source"
            type="source"
            position={Position.Top}
            style={{ ...sourceStyle}}
          />
          <Handle
            id="top-target"
            type="target"
            position={Position.Top}
            style={{ ...targetStyle}}
          />
        </>
      )}

      {/* IMAGEN */}
      {data.type === "R" && (
        <>
          <div style={{ position: "absolute", color: "red", fontWeight: "bold", ...plusPosition }}>
            +
          </div>

          <div style={{ position: "absolute", color: "blue", fontWeight: "bold", ...minusPosition }}>
            –
          </div>
        </>
      )}
      <img
        src={images[data.type]}
        alt={data.label}
        style={{
          width: imageSize,
          height: imageSize,
          transform: isGND ? "none" : `rotate(${rotation[data.orientation]})`,
          pointerEvents: "none",
        }}
      />

      {/* LABEL */}
      <div>{data.label}</div>
    </div>
  );
}