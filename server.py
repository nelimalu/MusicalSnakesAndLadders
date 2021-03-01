import asyncio
import websockets
import json
import random

players = {}
user_order = []
USERS = set()

colours = ["pawn_blue", "pawn_green", "pawn_orange", "pawn_red", "pawn_purple", "pawn_pink", "pawn_yellow"]
available_colours = ["pawn_blue", "pawn_green", "pawn_orange", "pawn_red", "pawn_purple", "pawn_pink", "pawn_yellow"]
turn_user = None
turn_index = None


async def connect(websocket, path):
    global turn_user, turn_index

    USERS.add(websocket)
    local_username = None
    async for message in websocket:
        category = message[:4]
        data = message[4:]

        if category == "COLR":
            local_username = [data][:][0]

            if len(available_colours) > 0:
                colour = random.choice(available_colours)
                available_colours.remove(colour)
            else:
                colour = random.choice(colours)

            await websocket.send("COLR" + colour)

        elif category == "JOIN":
            player = json.loads(data)
            user_order.append(player["username"])

            await websocket.send("DATA" + json.dumps(players))  # send the user all the player data

            players[player["username"]] = player
            if len(USERS) > 0:
                await asyncio.wait([user.send("NPLR" + json.dumps(players[player["username"]])) for user in USERS])  # send all players the new user
            if len(USERS) == 1:
                turn_user = local_username
                turn_index = user_order.index(local_username)

            try:
                await websocket.send("PTUR" + json.dumps(players[turn_user]))
            except:
                pass

        elif category == "MOVE":
            player = json.loads(data)
            players[player["username"]] = player

            if len(USERS) > 0:
                await asyncio.wait([user.send("MOVE" + data) for user in USERS])  # send everyone these new coords

        elif category == "DONE":
            turn_index = turn_index + 1 if turn_index + 1 < len(user_order) else 0
            turn_user = user_order[turn_index]
            await asyncio.wait([user.send("PTUR" + json.dumps(players[turn_user])) for user in USERS])

        elif category == "WINR":
            await asyncio.wait([user.send("WINR" + json.dumps(players[data])) for user in USERS])

    USERS.remove(websocket)
    print("mans left", local_username)
    del players[local_username]
    user_order.remove(local_username)

    if turn_user == local_username:
        turn_index = turn_index + 1 if turn_index + 1 < len(user_order) else 0
        turn_user = user_order[turn_index]
        await asyncio.wait([user.send("PTUR" + json.dumps(players[turn_user])) for user in USERS])

    if len(USERS) > 0:
        await asyncio.wait([user.send("DATA" + json.dumps(players)) for user in USERS])

start_server = websockets.serve(connect, "192.168.1.170", 1345)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
