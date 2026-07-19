SHELL := /bin/sh

.DEFAULT_GOAL := help

.PHONY: help install run dev build check frontend-check edge-check format supabase-init supabase-start edge-serve

help:
	@echo "Available commands:"
	@echo "  make install        Install frontend dependencies"
	@echo "  make run            Start the frontend development server"
	@echo "  make check          Run all frontend and Edge Function checks"
	@echo "  make build          Create a production frontend build"
	@echo "  make format         Format the Supabase Edge Function"
	@echo "  make supabase-init  Create local Supabase configuration"
	@echo "  make supabase-start Start the local Supabase stack (Docker required)"
	@echo "  make edge-serve     Serve evaluate-answer locally"

install:
	npm ci

run dev:
	npm run dev

build:
	npm run build

check: frontend-check edge-check

frontend-check:
	npm run typecheck
	npm run lint
	npm run build

edge-check:
	deno check --config supabase/functions/deno.json supabase/functions/evaluate-answer/index.ts supabase/functions/razorpay-webhook/index.ts
	deno lint --config supabase/functions/deno.json supabase/functions/evaluate-answer/index.ts supabase/functions/razorpay-webhook/index.ts
	deno fmt --check --config supabase/functions/deno.json supabase/functions/evaluate-answer/index.ts supabase/functions/razorpay-webhook/index.ts supabase/functions/deno.json

format:
	deno fmt --config supabase/functions/deno.json supabase/functions/evaluate-answer/index.ts supabase/functions/razorpay-webhook/index.ts supabase/functions/deno.json

supabase-init:
	supabase init

supabase-start:
	@test -f supabase/config.toml || (echo "Missing supabase/config.toml. Run 'make supabase-init' first." && exit 1)
	supabase start

edge-serve:
	@test -f supabase/config.toml || (echo "Missing supabase/config.toml. Run 'make supabase-init' first." && exit 1)
	@test -f supabase/.env.local || (echo "Missing supabase/.env.local with GEMINI_API_KEY and Supabase secrets." && exit 1)
	supabase functions serve evaluate-answer --env-file supabase/.env.local
