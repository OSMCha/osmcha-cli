all: frontend bin

frontend:
    # builds the javascript bundle
    cd frontend && rm -rf dist && npm run build

bin:
    cargo build
