ARG player_image
FROM $player_image
COPY ./out/ /home/sunbird/app_dist/tenant/sunbird/
WORKDIR /home/sunbird/app_dist
CMD ["node", "server.js", "&"]
