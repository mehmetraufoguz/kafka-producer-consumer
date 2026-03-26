import { defineConfig } from 'vocs'

export default defineConfig({
  title: 'Kafka Restaurant Analytics',
  description: 'Real-time restaurant comment sentiment analysis using Kafka microservices',
  aiCta: true,
  
  topNav: [
    { text: 'Documentation', link: '/' },
    { text: 'Setup', link: '/setup' },
    { text: 'GitHub', link: 'https://github.com/mehmetraufoguz/kafka-producer-consumer' },
  ],

  sidebar: [
    {
      text: 'Introduction',
      items: [
        { text: 'Overview', link: '/' },
        { text: 'Getting Started', link: '/getting-started' },
        { text: 'Setup Guide', link: '/setup' },
      ],
    },
    {
      text: 'Services',
      items: [
        { text: 'Producer', link: '/producer' },
        { text: 'Consumer', link: '/consumer' },
        { text: 'Sentiment', link: '/sentiment' },
        { text: 'API & SSE', link: '/api-sse' },
      ],
    },
    {
      text: 'Frontend',
      items: [
        { text: 'Dashboard', link: '/frontend' },
      ],
    },
  ],

  theme: {
    accentColor: '#4f8fb8',
  },
})