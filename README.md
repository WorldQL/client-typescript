# WorldQL Client [![Node.js CI](https://github.com/WorldQL/client-typescript/actions/workflows/ci.yml/badge.svg)](https://github.com/WorldQL/client-typescript/actions/workflows/ci.yml)
> TypeScript Client for interacting with WorldQL over WebSockets

## Documentation and Examples
You can view setup instructions and a collection of code snippets on the WorldQL [documentation site](https://docs.worldql.com/client-libraries/typescript), along with a more in-depth [guide on building a real-world example project](https://docs.worldql.com/example-projects/chat-room).

## Community
Join our [Discord Server](https://discord.gg/tDZkXQPzEw) for news and updates surrounding WorldQL!

## Quickstart
Below is a quick sample of code to get a client running and sending/receiving messages.
```ts
import { Client, Replication } from '@worldql/client'

const client = new Client({
  // URL of the WorldQL Server Websocket Endpoint
  url: 'ws://localhost:8080',

  // Optional server auth token
  // Omit if the server has auth disabled
  auth: 'password'
})

// Log errors to console
client.on('error', error => {
  console.error(error)
})

// Log incoming global messages
client.on('globalMessage', (sender, world, data) => {
  console.log('globalMessage', { sender, world, data })
})

// Run code as soon as the client is ready
client.on('ready', async () => {
  console.log('ready')

  // Subscribe to messages on this world
  const subscribed = await client.worldSubscribe('world')
  console.log(subscribed)

  // Send a global message to the world we just subscribed to
  client.globalMessage('world', Buffer.from('hello world'), Replication.IncludingSelf)
})

// Connect to the WorldQL Server
client.connect()
```
