<!-- vim:ts=4:sts=4:sw=4:et:tw=60 -->

# 0.3.1

-   Added example of communicating with an iframe.
-   Added "origin" option to simplify communicating between
    window message ports.

# 0.3.0 - REBOOT

-   Q_COMM.Connection now accepts message ports and
    assimilates them.  There are no specialized adapters.
    That is left as an exercise for other libraries.

# 0.2.0 - BACKWARD INCOMPATIBLE*

-   Remote objects can now be directly connected using any
    W3C message port including web workers and web sockets.
-   *Brought message port adapter code into q-comm.js and
    moved all other communication layers out to separate
    packages (to be q-comm-socket.io and q-comm-node).
-   *Renamed `Peer` to `Connection`.

# 0.1.2

-   Added Mozilla Jetpack packaging support. (gozala)

# 0.1.1

-   Alterations to far references
-   Upgraded Q for duck-promises

# 0.1.0 - BACKWARD INCOMPATIBLE

-   Removed the socket.io-server "Server" constructor and
    renamed "SocketServer" to "Server".  Creating an
    object-to-object link and creating a connection are now
    explicitly separated in all usage.
-   Added the local object argument to the socket.io-client
    connection constructor.
-   Added a "swarm" example.

# 0.0.3

-   Upgraded dependency on `q` to v0.2.2 to fix bug in Queue
    implementation.

# 0.0.2

-   Added missing dependency on `n-util`.

# 0.0.1

-   Removed false dependency on `q-io`.

