export type RoomCursor='normal'|'click'|'pet'|'gift'|'bath';
// CSS applies these assets only to devices with a mouse/fine hover pointer.
export function setRoomCursor(cursor:RoomCursor){document.body.dataset.roomCursor=cursor;}
