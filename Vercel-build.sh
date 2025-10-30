#!/bin/bash
echo "⚙️ Installing missing Supabase SSR package..."
npm install @supabase/ssr@latest
npm run build
