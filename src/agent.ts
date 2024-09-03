import dotenv from "dotenv";
dotenv.config();

import type { AIMessage } from "@langchain/core/messages";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

import { END, MessagesAnnotation, StateGraph, Send } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatAnthropic } from "@langchain/anthropic";
import { Annotation } from "@langchain/langgraph";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";
import { MemorySaver } from "@langchain/langgraph";

// Graph state
const AgentState = Annotation.Root({
    input: Annotation<string>({
        reducer: (x) => x ?? "",
    }),
    course_name: Annotation<any>({
        reducer: (x) => x ?? "",
    }),
    modules: Annotation<any>({
        reducer: (x) => x ?? [],
    }),
    messages: Annotation<any[]>({
        reducer: (x, y) => y ?? x ?? [],
    }),
    module_descriptions: Annotation<string[]>({
        reducer: (state, update) => state.concat(update),
    }),
    module_scripts: Annotation<string[]>({
        reducer: (state, update) => state.concat(update),
    }),
})

// Define the tools
const tools = [
  new TavilySearchResults({ maxResults: 3, apiKey: process.env.TAVILY_API_KEY}),
];

// Define the nodes
async function courseOutlineNode(
  state: typeof AgentState.State,
) {
    /**
     * Call the LLM powering our agent.
     * Feel free to customize the prompt, model, and other logic!
     */

    const outputSchema = z.object({
        course_name: z.string().describe("The name of the course"),
        modules: z.array(z.string()).describe("The list of modules"),
    });

    const model = new ChatAnthropic({
        model: "claude-3-5-sonnet-20240620",
    }).withStructuredOutput(outputSchema)

    const response = await model.invoke([
        {
        role: "system",
        content: `You are a course outline generator. Generate a course outline based on the users input.`
        },{
            role: "user",
            content: `The user's query is: ${state.input}. Generate a course name and list of modules for the user's query.`
        }
    ])

    // console.log(response);

    // MessagesAnnotation supports returning a single message or array of messages
    return { course_name: response.course_name, modules: response.modules, messages: [response] };
}

async function moduleDescriptionNode(
  state: {module: string, course_name: string},
) {
    const outputSchema = z.object({
        module_description: z.string().describe("The module description"),
        module_script: z.string().describe("The module script"),
    });

    const model = new ChatAnthropic({
        model: "claude-3-5-sonnet-20240620",
    })
    .withStructuredOutput(outputSchema)

    // console.log(state)
    // console.log(model)

    const response = await model.invoke([
        {
            role: "system",
            content: `You are a course outline generator. Generate a module description that explains what the module is about (max. 50 words) and a module script that essentially teaches the module (max. 100 words) using the module name and course name.`
        },{
            role: "user",
            content: `The module name is: ${state.module}. The course name is: ${state.course_name}.`
        }
    ])

    // console.log(response)

    return {module_descriptions: [response.module_description], module_scripts: [response.module_script]};
}

// Define the function that determines whether to continue or not
function routeModelOutput(state: typeof AgentState.State) {
  const messages = state.messages;
  const lastMessage: AIMessage = messages[messages.length - 1];
  // If the LLM is invoking tools, route there.
  if ((lastMessage?.tool_calls?.length ?? 0) > 0) {
    return "tools";
  }
  // Otherwise end the graph.
  return "moduleDescriptionNode";
}

const continueToModules = (state: typeof AgentState.State) => {
    // We will return a list of `Send` objects
    // Each `Send` object consists of the name of a node in the graph
    // as well as the state to send to that node
    return state.modules.map((module:any) => new Send("moduleDescriptionNode", { module, course_name: state.course_name }));
};

// Define a new graph.
// more on defining custom graph states.
const workflow = new StateGraph(AgentState)
  // Define the two nodes we will cycle between
  .addNode("courseOutlineNode", courseOutlineNode)
  .addNode("moduleDescriptionNode", moduleDescriptionNode)
  .addNode("tools", new ToolNode(tools))
  // Set the entrypoint as `callModel`
  // This means that this node is the first one called
  .addEdge("__start__", "courseOutlineNode")
  .addConditionalEdges(
    // First, we define the edges' source node. We use `callModel`.
    // This means these are the edges taken after the `callModel` node is called.
    "courseOutlineNode",
    // Next, we pass in the function that will determine the sink node(s), which
    // will be called after the source node is called.
    continueToModules,
    // List of the possible destinations the conditional edge can route to.
    // Required for conditional edges to properly render the graph in Studio
    [
      "moduleDescriptionNode",
      "tools"
    ],
  )
  // This means that after `tools` is called, `callModel` node is called next.
  .addEdge("tools", "courseOutlineNode")
  .addEdge("moduleDescriptionNode", END)

const memory = new MemorySaver()

// Finally, we compile it!
// This compiles it into a graph you can invoke and deploy.
export const graph = workflow.compile({
    // checkpointer: memory,
  // if you want to update the state before calling the tools
  // interruptBefore: [],
});
