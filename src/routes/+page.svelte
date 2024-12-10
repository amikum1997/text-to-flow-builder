<script lang="ts">
  import { page } from "$app/stores";
  import type { Node, Connection, ParseResult } from "./+page";

  // Local state variables
  let textareaContent: string = "";
  let errorMessage: string = "";
  let chartType: string = "";
  let chartName: string = "";
  let nodes: Node[] = [];
  let connections: Connection[] = [];

  // Computed property for parsing the textarea content
  $: parseResult = $page.data.parseChartType?.(textareaContent) ?? {
    errorMessage: "",
    chartType: "",
    chartName: "",
    nodes: [],
    connections: [],
  };

  // Ensure parseResult has the correct inferred structure
  $: {
    errorMessage = parseResult.errorMessage;
    chartType = parseResult.chartType;
    chartName = parseResult.chartName;
    nodes = parseResult.nodes;
    connections = parseResult.connections;
  }

  // Helper function for finding a node by ID (type-safe)
  const findNodeById = (id: string): Node | undefined =>
    nodes.find((n) => n.id === id);

  // Calculate line endpoint with offset
  function calculateLineEndpoint(
    fromNode: Node,
    toNode: Node,
    offset: number = 50
  ) {
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    // Normalize the vector and scale by offset
    const unitX = dx / length;
    const unitY = dy / length;

    return {
      x1: fromNode.x + offset,
      y1: fromNode.y + 25,
      x2: toNode.x + offset,
      y2: toNode.y + 25,
    };
  }
</script>

<div class="flex flex-col h-screen w-screen">
  <header class="flex bg-gray-100 p-4 border-b border-gray-300">
    <h1 class="text-xl font-bold text-gray-800">
      Diagram Editor {chartType ? "|" : ""}
    </h1>
    <h1 class="mx-2 text-xl text-gray-800">{chartType} {chartName}</h1>
  </header>

  <div class="flex flex-grow">
    <!-- Input section -->
    <div class="w-3/10 h-full border-r-2 border-gray-300 p-4 flex flex-col">
      <textarea
        id="editor"
        class="w-[350px] flex-grow resize-none p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Enter your diagram text here ..."
        bind:value={textareaContent}
      ></textarea>

      {#if errorMessage}
        <div class="text-red-500 text-sm mt-2 h-6">
          {errorMessage}
        </div>
      {:else if chartType}
        <div class="text-green-500 text-sm mt-2 h-6">
          Chart Type: {chartType}
          {#if chartName}
            | Name: {chartName}
          {/if}
        </div>
      {:else}
        <div class="h-6"></div>
      {/if}
    </div>

    <!-- SVG rendering section -->
    <div class="w-7/10 h-full bg-white relative w100">
      <svg
        id="drawingCanvas"
        class="w-full h-full bg-dotted"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- Arrowhead marker definitions -->
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="0"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <path d="M0,0 L10,3.5 L0,7" fill="black" />
          </marker>
        </defs>

        <!-- Draw connections -->
        {#each connections as { from, to, direction }}
          {#if findNodeById(from) && findNodeById(to)}
            {@const fromNode = findNodeById(from)!}
            {@const toNode = findNodeById(to)!}
            {@const { x1, y1, x2, y2 } = calculateLineEndpoint(
              fromNode,
              toNode
            )}
            <line
              {x1}
              {y1}
              {x2}
              {y2}
              stroke={direction === "backward" ? "red" : "black"}
              stroke-width="2"
              marker-end="url(#arrowhead)"
            />
          {/if}
        {/each}

        <!-- Draw nodes -->
        {#each nodes as { id, type, x, y, label }}
          <rect
            {x}
            {y}
            width="100"
            height="50"
            fill={type === "node" ? "blue" : "green"}
            stroke="black"
            stroke-width="2"
            rx={type === "block" ? 10 : 0}
            ry={type === "block" ? 10 : 0}
          />
          <text x={x + 50} y={y + 30} text-anchor="middle" fill="white">
            {label}
          </text>
        {/each}
      </svg>
    </div>
  </div>
</div>

<style>
  .bg-dotted {
    background-image: radial-gradient(#cbd5e0 1px, transparent 1px);
    background-size: 20px 20px;
  }

  .w100 {
    width: 100% !important;
  }
</style>
