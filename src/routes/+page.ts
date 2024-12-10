export type NodeType = "node" | "block";
export type BracketType = "[]" | "[[]]" | "()" | "(())" | "[()]";
export type ConnectionDirection = "forward" | "backward";

export interface Node {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  incoming: string[];
  outgoing: string[];
  bracketType: BracketType;
}

export interface Connection {
  from: string;
  to: string;
  direction: ConnectionDirection;
}

export interface ParseResult {
  errorMessage: string;
  chartType: string;
  chartName: string;
  nodes: Node[];
  connections: Connection[];
}

export const load = () => {
  return {
    parseChartType: (textareaContent: string): ParseResult => {
      const result: ParseResult = {
        errorMessage: "",
        chartType: "",
        chartName: "",
        nodes: [],
        connections: [],
      };

      const lines = textareaContent.split("\n");
      if (!lines.length) return result;

      const nodes = new Map<string, Node>(); // Map to track nodes by ID
      const connections: Connection[] = []; // Array for connections

      // Enhanced regex to capture more bracket types
      const fullDefinitionPattern = 
        /^(.+?)\s*-\s*([\[\(]+)(.+?)[)\]]+\s*-->\s*(.+?)\s*-\s*([\[\(]+)(.+?)[)\]]+$/;
      const simpleConnectionPattern = 
        /^(.+?)\s*-->\s*(.+?)\s*-\s*([\[\(]+)(.+?)[)\]]+$/;
      const reverseConnectionPattern = 
        /^(.+?)\s*-\s*([\[\(]+)(.+?)[)\]]+\s*<--\s*(.+?)\s*$/;

      // Bracket type mapping function
      const mapBracketType = (bracket: string): BracketType => {
        switch (bracket) {
          case "[": return "[]";
          case "[[": return "[[]]";
          case "(": return "()";
          case "((": return "(())";
          case "[(": return "[()]";
          default: return "[]"; // Default fallback
        }
      };

      // Function to determine X position for new nodes
      const determineXPosition = (existingNodes: Map<string, Node>, sourceId: string, targetId: string): { sourceX: number, targetX: number } => {
        const sourceNode = existingNodes.get(sourceId);
        if (!sourceNode) {
          return { 
            sourceX: 100, 
            targetX: 300 
          };
        }

        // Count existing connections from source
        const existingOutgoing = sourceNode.outgoing.length;

        // Calculate X positions based on existing connections
        const sourceX = sourceNode.x;
        const targetX = existingOutgoing % 2 === 0 
          ? sourceX + 250 * (1 + Math.floor(existingOutgoing / 2))
          : sourceX - 250 * (1 + Math.floor(existingOutgoing / 2));

        return { sourceX, targetX };
      };

      lines.forEach((line, index) => {
        let parsed: RegExpMatchArray | null = null;
        let sourceId: string | undefined;
        let targetId: string | undefined;
        let sourceLabel: string | undefined;
        let targetLabel: string | undefined;
        let sourceType: NodeType | undefined;
        let targetType: NodeType | undefined;
        let sourceBracket: string | undefined;
        let targetBracket: string | undefined;
        let connectionDirection: ConnectionDirection = "forward";

        // Try full forward connection pattern
        parsed = line.match(fullDefinitionPattern);
        if (parsed) {
          [
            parsed[0],
            sourceId,
            sourceBracket,
            sourceLabel,
            targetId,
            targetBracket,
            targetLabel,
          ] = parsed;
          sourceType = sourceBracket === "[" || sourceBracket === "[[" ? "node" : "block";
          targetType = targetBracket === "[" || targetBracket === "[[" ? "node" : "block";
          connectionDirection = "forward";
        } else {
          // Try simple forward connection pattern
          parsed = line.match(simpleConnectionPattern);
          if (parsed) {
            [parsed[0], sourceId, targetId, targetBracket, targetLabel] = parsed;
            targetType = targetBracket === "[" || targetBracket === "[[" ? "node" : "block";
            connectionDirection = "forward";
          } else {
            // Try reverse connection pattern
            parsed = line.match(reverseConnectionPattern);
            if (parsed) {
              [parsed[0], targetId, targetBracket, targetLabel, sourceId] = parsed;
              targetType = targetBracket === "[" || targetBracket === "[[" ? "node" : "block";
              connectionDirection = "backward";
            }
          }
        }

        if (parsed && sourceId && targetId) {
          // Determine positioning
          const { sourceX, targetX } = determineXPosition(nodes, sourceId, targetId);

          // Add or update source node
          if (!nodes.has(sourceId)) {
            nodes.set(sourceId, {
              id: sourceId,
              type: sourceType || "node",
              label: sourceLabel || sourceId,
              x: sourceX,
              y: 50 + (nodes.size * 150),
              incoming: [],
              outgoing: [],
              bracketType: mapBracketType(sourceBracket || "["),
            });
          }

          // Add or update target node
          if (!nodes.has(targetId)) {
            nodes.set(targetId, {
              id: targetId,
              type: targetType || "node",
              label: targetLabel || targetId,
              x: targetX,
              y: 50 + (nodes.size * 150),
              incoming: [],
              outgoing: [],
              bracketType: mapBracketType(targetBracket || "["),
            });
          }

          // Add the connection
          const connection: Connection = {
            from: connectionDirection === "forward" ? sourceId : targetId,
            to: connectionDirection === "forward" ? targetId : sourceId,
            direction: connectionDirection,
          };
          connections.push(connection);

          // Update incoming/outgoing connections
          const sourceNode = nodes.get(sourceId);
          const targetNode = nodes.get(targetId);

          if (sourceNode && targetNode) {
            if (connectionDirection === "forward") {
              if (!sourceNode.outgoing.includes(targetId)) {
                sourceNode.outgoing.push(targetId);
              }
              if (!targetNode.incoming.includes(sourceId)) {
                targetNode.incoming.push(sourceId);
              }
            } else {
              if (!targetNode.outgoing.includes(sourceId)) {
                targetNode.outgoing.push(sourceId);
              }
              if (!sourceNode.incoming.includes(targetId)) {
                sourceNode.incoming.push(targetId);
              }
            }
          }
        } else {
          result.errorMessage = `Invalid syntax on line ${index + 1}`;
        }
      });

      result.nodes = Array.from(nodes.values());
      result.connections = connections;
      return result;
    },
  };
};