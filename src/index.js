import React from "react";
import ReactDOM from "react-dom";
import './App.css';
import App from "./App";
import registerServiceWorker from "./registerServiceWorker";
import { ApolloClient, InMemoryCache, HttpLink, split } from "apollo-boost";
import { ApolloProvider } from "react-apollo";
import { WebSocketLink } from "apollo-link-ws";
import { getMainDefinition } from "apollo-utilities";

const httpLink = new HttpLink({
  uri: "http://192.168.1.116:9000/query"
});

const wsLink = new WebSocketLink({
  uri: `ws://192.168.1.116:9000/query`,
  options: {
    reconnect: true
  }
});

const link = split(
  ({ query }) => {
    const { kind, operation } = getMainDefinition(query);
    return kind === "OperationDefinition" && operation === "subscription";
  },
  wsLink,
  httpLink
);

const client = new ApolloClient({ link, cache: new InMemoryCache(), queryDeduplication: false });

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById("root")
);
registerServiceWorker();
