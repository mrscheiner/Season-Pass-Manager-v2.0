#!/usr/bin/env python3
# Fix game numbers: Tampa should be game 22, not 21

with open('constants/panthersSchedule.ts', 'r') as f:
    content = f.read()

# Replace game 21 (Tampa) with game 22
content = content.replace(
    "id: '21',\n    date: 'Dec 27, 2025',\n    month: 'Dec',\n    day: '27',\n    opponent: 'vs Tampa Bay Lightning',\n    opponentLogo: getOpponentLogo('vs Tampa Bay Lightning'),\n    time: '7:00 PM ET',\n    ticketStatus: 'Available',\n    isPaid: false,\n    type: 'Regular',\n    gameNumber: '21',",
    "id: '22',\n    date: 'Dec 27, 2025',\n    month: 'Dec',\n    day: '27',\n    opponent: 'vs Tampa Bay Lightning',\n    opponentLogo: getOpponentLogo('vs Tampa Bay Lightning'),\n    time: '7:00 PM ET',\n    ticketStatus: 'Available',\n    isPaid: false,\n    type: 'Regular',\n    gameNumber: '22',"
)

# Replace game 22 (Washington) with game 23
content = content.replace(
    "id: '22',\n    date: 'Dec 29, 2025',\n    month: 'Dec',\n    day: '29',\n    opponent: 'vs Washington Capitals',\n    opponentLogo: getOpponentLogo('vs Washington Capitals'),\n    time: '7:00 PM ET',\n    ticketStatus: 'Available',\n    isPaid: false,\n    type: 'Regular',\n    gameNumber: '22',",
    "id: '23',\n    date: 'Dec 29, 2025',\n    month: 'Dec',\n    day: '29',\n    opponent: 'vs Washington Capitals',\n    opponentLogo: getOpponentLogo('vs Washington Capitals'),\n    time: '7:00 PM ET',\n    ticketStatus: 'Available',\n    isPaid: false,\n    type: 'Regular',\n    gameNumber: '23',"
)

# Now increment all games from 23 to 40 by 1
for i in range(40, 22, -1):  # Go backwards to avoid double-replacement
    old_num = str(i)
    new_num = str(i + 1)
    
    # Replace id
    content = content.replace(f"id: '{old_num}',", f"id: '{new_num}',")
    # Replace gameNumber
    content = content.replace(f"gameNumber: '{old_num}',", f"gameNumber: '{new_num}',")

with open('constants/panthersSchedule.ts', 'w') as f:
    f.write(content)

print("✅ Fixed! Tampa Bay is now Game 22")
print("   Games 23-41 renumbered")
