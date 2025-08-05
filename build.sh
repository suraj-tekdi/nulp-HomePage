#!/bin/bash
# Build script
set -o pipefail
image_tag=$1
node_name=$2
hub_org=$3
image_name=$4
tenant_tag=$5
commit_hash=$6

docker build -f ./Dockerfile --build-arg player_image=${hub_org}/${image_name}:${image_tag} -t ${hub_org}/${image_name}:${image_tag}_${tenant_tag} .
echo {\"image_name\" : \"${image_name}\", \"image_tag\" : \"${image_tag}_${tenant_tag}\",\"commit_hash\" : \"${commit_hash}\", \"node_name\" : \"$node_name\"}  > metadata.json
