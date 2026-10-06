#!/bin/bash

KEY_NAME=${1:-"super-market-vps"}
KEY_PATH="$HOME/.ssh/$KEY_NAME"

if [ ! -f "$KEY_PATH" ]; then
  echo "Generating new SSH key at $KEY_PATH..."
  ssh-keygen -t ed25519 -C "vps-key@$KEY_NAME" -f "$KEY_PATH" -N "" -q
else
  echo "SSH key already exists at $KEY_PATH."
fi

echo "----------------------------------------"
cat "${KEY_PATH}.pub"
echo "----------------------------------------"