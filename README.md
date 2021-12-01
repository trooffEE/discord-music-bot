# discord-music-bot
# Heroku-Name
bot-zona

# Restart Zona 
```
heroku ps:restart worker.1 --app bot-zona
````

# Temroary scale down worker - by any means put in a no traffic state
```
heroku ps:scale worker=0 --app bot-zona
````