import { Socket } from "socket.io";

export default  function extractUserId(socket: Socket) : string | null {
    // @ts-ignore
    return socket.userId;
}