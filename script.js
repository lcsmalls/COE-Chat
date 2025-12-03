        // Initialize Firebase
        const firebaseConfig = {
          apiKey: "AIzaSyAEy_3vzbu0lvpB92zD3P6FcAgwmqQsfbU",
          authDomain: "freechat-30fd6.firebaseapp.com",
          projectId: "freechat-30fd6",
          storageBucket: "freechat-30fd6.appspot.com",
          messagingSenderId: "994973905020",
          appId: "1:994973905020:web:6ce7370a069a3cd2dd99f9",
          databaseURL: "https://freechat-30fd6-default-rtdb.firebaseio.com",
          measurementId: "G-9V8QZ106H0"
        };
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();
        const rtdb = firebase.database();
        let currentUser = null;
        let userData = null;
        let currentChatId = null;
        let currentChatType = null;
        let currentGroupData = null; // Store current group data
        let messagesUnsubscribe = null;
        let friendsData = {};
        let blockedData = {};
        let chatListeners = {};
        let userProfileListener = null;
        let friendRequestListener = null;
        let onlineStatusListener = null;
        let typingIndicatorListener = null;
        const authScreen = document.getElementById('auth-screen');
        const createAccountFormContainer = document.getElementById('create-account-form-container');
        const loginFormContainer = document.getElementById('login-form-container');
        const appContainer = document.getElementById('app-container');
        const mainSidebar = document.getElementById('main-sidebar');
        const chatPage = document.getElementById('chat-page');
        const showCreateAccountBtn = document.getElementById('show-create-account-btn');
        const showLoginBtn = document.getElementById('show-login-btn');
        const createAccountBtn = document.getElementById('create-account-btn');
        const loginBtn = document.getElementById('login-btn');
        const backToAuthBtn = document.getElementById('back-to-auth-btn');
        const backToAuthLoginBtn = document.getElementById('back-to-auth-login-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const newEmailInput = document.getElementById('new-email');
        const newPasswordInput = document.getElementById('new-password');
        const newUsernameInput = document.getElementById('new-username');
        const loginEmailInput = document.getElementById('login-email');
        const loginPasswordInput = document.getElementById('login-password');
        const userInfoDiv = document.getElementById('user-info');
        const addFriendInput = document.getElementById('add-friend-input');
        const addFriendBtn = document.getElementById('add-friend-btn');
        const friendsList = document.getElementById('friends-list');
        const chatMessages = document.getElementById('chat-messages');
        const messageInput = document.getElementById('message-input');
        const sendBtn = document.getElementById('send-btn');
        const chatHeader = document.getElementById('chat-header');
        const backToSidebarBtn = document.getElementById('back-to-sidebar-btn');
        const currentChatInfo = document.getElementById('current-chat-info');
        const createGroupBtn = document.getElementById('create-group-btn');
        const createGroupModal = document.getElementById('create-group-modal');
        const groupNameInput = document.getElementById('group-name-input');
        const groupFriendsList = document.getElementById('group-friends-list');
        const confirmCreateGroupBtn = document.getElementById('confirm-create-group-btn');
        const cancelCreateGroupBtn = document.getElementById('cancel-create-group-btn');
        const leaveGroupBtn = document.getElementById('leave-group-btn');
        const imageUploadBtn = document.getElementById('image-upload-btn');
        const imagePreviewDiv = document.getElementById('image-preview');
        const imageThumbnail = document.getElementById('image-thumbnail');
        const clearImageBtn = document.getElementById('clear-image-btn');
        let uploadedImageFile = null;
        const bubbleColorPicker = document.getElementById('bubble-color-picker');
        const saveColorBtn = document.getElementById('save-color-btn');
        const toggleBlockedBtn = document.getElementById('toggle-blocked-btn');
        const blockedUsersList = document.getElementById('blocked-users-list');
        // NEW UI elements for Friend Request System
        const friendRequestsBtn = document.getElementById('friend-requests-btn');
        const requestsBadge = document.getElementById('requests-badge');
        const friendRequestsList = document.getElementById('friend-requests-list');
        // NEW UI elements for Typing Indicator
        const typingIndicator = document.getElementById('typing-indicator');
        let isTyping = false;
        let typingTimeout = null;
        // NEW UI elements for Group Settings
        const groupSettingsBtn = document.getElementById('group-settings-btn');
        const groupSettingsModal = document.getElementById('group-settings-modal');
        const groupSettingsTitle = document.getElementById('group-settings-title');
        const closeSettingsModalBtn = document.getElementById('close-settings-modal-btn');
        const addMemberBtn = document.getElementById('add-member-btn');
        const deleteGroupBtn = document.getElementById('delete-group-btn');
        const transferOwnerBtn = document.getElementById('transfer-owner-btn');
        const addMemberModal = document.getElementById('add-member-modal');
        const addMemberFriendsList = document.getElementById('add-member-friends-list');
        const confirmAddMembersBtn = document.getElementById('confirm-add-members-btn');
        const cancelAddMembersBtn = document.getElementById('cancel-add-members-btn');
        const transferOwnershipModal = document.getElementById('transfer-ownership-modal');
        const transferOwnerList = document.getElementById('transfer-owner-list');
        const confirmTransferBtn = document.getElementById('confirm-transfer-btn');
        const cancelTransferBtn = document.getElementById('cancel-transfer-btn');
        let unreadCounts = {}; // Track unread counts per chat
        // --- UNREAD MESSAGE COUNT & PAGE TITLE LOGIC ---
        function updateUnreadTitle() {
          const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);
          if (totalUnread > 0) {
            document.title = `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}`;
          } else {
            document.title = "Chat (working title)";
          }
        }
        // --- AUTHENTICATION & UI LOGIC ---
        auth.onAuthStateChanged(async (user) => {
          if (user) {
            currentUser = user;
            setupOnlinePresence();
            // Explicitly set online status after login (fallback)
            try {
              await rtdb.ref('/status/' + currentUser.uid).set({
                isOnline: true,
                last_changed: firebase.database.ServerValue.TIMESTAMP
              });
              console.log('Set own status to online:', currentUser.uid);
            } catch (err) {
              console.error('Error setting online status:', err);
            }
            if (!userProfileListener) {
              userProfileListener = db.collection('profiles').doc(currentUser.uid).onSnapshot(async (doc) => {
                if (doc.exists) {
                  userData = doc.data();
                  showMainApp();
                  listenForFriendsAndGroups();
                  listenForFriendRequests();
                } else {
                  showNotification("User profile not found. This should not happen on a successful login.");
                  await auth.signOut();
                }
              }, (error) => {
                showNotification("Error listening to user profile.");
              });
            }
          } else {
            // Do NOT manually set status to offline here; let onDisconnect handle it
            if (userProfileListener) userProfileListener();
            if (friendRequestListener) friendRequestListener();
            userProfileListener = null;
            friendRequestListener = null;
            Object.values(chatListeners).forEach(unsubscribe => {
              if (Array.isArray(unsubscribe)) {
                unsubscribe.forEach(f => f());
              } else {
                unsubscribe();
              }
            });
            chatListeners = {};
            if (messagesUnsubscribe) messagesUnsubscribe();
            messagesUnsubscribe = null;
            showAuthScreen();
            currentUser = null;
          }
        });

        function showAuthScreen() {
          authScreen.style.display = 'flex';
          createAccountFormContainer.style.display = 'none';
          loginFormContainer.style.display = 'none';
          appContainer.style.display = 'none';
        }

        function showMainApp() {
          authScreen.style.display = 'none';
          createAccountFormContainer.style.display = 'none';
          loginFormContainer.style.display = 'none';
          appContainer.style.display = 'flex';
          chatPage.style.display = 'none';
          mainSidebar.style.display = 'flex';
          userInfoDiv.innerHTML = `<strong>${userData.username}#</strong><span class="token">${userData.tag}</span>`;
          if (userData.bubbleColor) {
            bubbleColorPicker.value = userData.bubbleColor;
            document.getElementById('modal-bubble-color-picker').value = userData.bubbleColor;
          }
          document.getElementById('modal-username').textContent = `${userData.username}#${userData.tag}`;
          updateUnreadTitle(); // Set initial title
        }
        // CORRECTED KEYBOARD LISTENER
        document.addEventListener('keydown', (e) => {
          const activeElementTag = document.activeElement.tagName.toLowerCase();
          if (activeElementTag === 'input' || activeElementTag === 'textarea') {
            return;
          }
          if (chatPage.style.display === 'flex' && e.key !== 'Enter') {
            messageInput.focus();
            setTypingStatus(true);
          }
        });
        // CORRECTED MESSAGE INPUT LISTENER
        messageInput.addEventListener('keydown', (e) => {
          setTypingStatus(true);
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendBtn.click();
            setTypingStatus(false);
          }
        });
        // --- Typing indicator logic: stricter fix ---
        // Remove ALL previous typing status logic for messageInput
        let typingActive = false;
        messageInput.addEventListener('focus', () => {
          if (messageInput.value.trim().length > 0) {
            setTypingStatus(true);
            typingActive = true;
          } else {
            setTypingStatus(false);
            typingActive = false;
          }
        });
        messageInput.addEventListener('input', () => {
          if (document.activeElement === messageInput && messageInput.value.trim().length > 0) {
            if (!typingActive) {
              setTypingStatus(true);
              typingActive = true;
            }
          } else {
            if (typingActive) {
              setTypingStatus(false);
              typingActive = false;
            }
          }
        });
        messageInput.addEventListener('blur', () => {
          if (typingActive) {
            setTypingStatus(false);
            typingActive = false;
          }
        });
        showCreateAccountBtn.addEventListener('click', () => {
          authScreen.style.display = 'none';
          createAccountFormContainer.style.display = 'flex';
        });
        showLoginBtn.addEventListener('click', () => {
          authScreen.style.display = 'none';
          loginFormContainer.style.display = 'flex';
        });
        backToAuthBtn.addEventListener('click', showAuthScreen);
        backToAuthLoginBtn.addEventListener('click', showAuthScreen);
        logoutBtn.addEventListener('click', async () => await auth.signOut());
        // --- Notification Modal Logic ---
        function showNotification(message, callback) {
          document.getElementById('notification-modal-message').textContent = message;
          document.getElementById('notification-modal').style.display = 'flex';
          // Optional callback for after closing
          document.getElementById('notification-modal-close-btn').onclick = function() {
            document.getElementById('notification-modal').style.display = 'none';
            if (typeof callback === 'function') callback();
          };
        }
        // --- AUTH LOGIC: Fix login and create account ---
        loginBtn.addEventListener('click', async () => {
          const email = loginEmailInput.value.trim();
          const password = loginPasswordInput.value;
          if (!email || !password) {
            showNotification("Please enter your email and password.");
            return;
          }
          try {
            await auth.signInWithEmailAndPassword(email, password);
            // Modal will close automatically if error, otherwise onAuthStateChanged will handle UI
          } catch (error) {
            showNotification("Login failed: " + error.message);
          }
        });
        createAccountBtn.addEventListener('click', async () => {
          const email = newEmailInput.value.trim();
          const password = newPasswordInput.value;
          const username = newUsernameInput.value.trim();
          if (!email || !password || !username) {
            showNotification("Please fill in all fields.");
            return;
          }
          try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const tag = Math.floor(1000 + Math.random() * 9000);
            await db.collection('profiles').doc(userCredential.user.uid).set({
              username: username,
              tag: tag,
              friends: [],
              blocked: [],
              bubbleColor: '#4a90e2'
            });
            // Modal will close automatically if error, otherwise onAuthStateChanged will handle UI
          } catch (error) {
            showNotification("Error: " + error.message);
          }
        });
        // --- Fix: Only one modal at a time ---
        function closeAllModals() {
          document.getElementById('notification-modal').style.display = 'none';
          // ...close other modals if needed...
        }
        // --- FRIENDS & MESSAGING LOGIC ---
        addFriendBtn.addEventListener('click', async () => {
          const friendTag = addFriendInput.value.trim();
          if (!friendTag.includes('#')) {
            showNotification("Please enter a valid username#tag.");
            return;
          }
          const [username, tagString] = friendTag.split('#');
          const tag = parseInt(tagString, 10);
          if (!username || isNaN(tag)) {
            showNotification("Invalid format. Use username#tag.");
            return;
          }
          try {
            const querySnapshot = await db.collection('profiles')
              .where('username', '==', username)
              .where('tag', '==', tag)
              .limit(1)
              .get();
            if (querySnapshot.empty) {
              showNotification("User not found.");
              return;
            }
            const friendDoc = querySnapshot.docs[0];
            const friendId = friendDoc.id;
            if (friendId === currentUser.uid) {
              showNotification("You cannot add yourself.");
              return;
            }
            if (userData.friends.includes(friendId)) {
              showNotification("This user is already your friend.");
              return;
            }
            const existingRequest = await db.collection('friend_requests')
              .where('from', '==', currentUser.uid)
              .where('to', '==', friendId)
              .get();
            if (!existingRequest.empty) {
              showNotification("A friend request has already been sent to this user.");
              return;
            }
            const incomingRequest = await db.collection('friend_requests')
              .where('from', '==', friendId)
              .where('to', '==', currentUser.uid)
              .get();
            if (!incomingRequest.empty) {
              showNotification("This user has already sent you a friend request. Please check your pending requests.");
              return;
            }
            await db.collection('friend_requests').add({
              from: currentUser.uid,
              to: friendId,
              timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            showNotification("Friend request sent successfully!");
            addFriendInput.value = '';
          } catch (error) {
            showNotification("Error sending friend request: " + error.message);
          }
        });

        function listenForFriendRequests() {
          if (friendRequestListener) friendRequestListener();
          friendRequestListener = db.collection('friend_requests')
            .where('to', '==', currentUser.uid)
            .onSnapshot(async (snapshot) => {
              const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              requestsBadge.textContent = requests.length;
              requestsBadge.style.display = requests.length > 0 ? 'block' : 'none';
              friendRequestsList.innerHTML = '';
              if (requests.length === 0) {
                friendRequestsList.textContent = "No pending requests.";
                return;
              }
              for (const req of requests) {
                const fromUserDoc = await db.collection('profiles').doc(req.from).get();
                if (!fromUserDoc.exists) continue;
                const fromUserData = fromUserDoc.data();
                const reqItem = document.createElement('div');
                reqItem.classList.add('request-item');
                reqItem.innerHTML = `
                            <span>${fromUserData.username}#${fromUserData.tag}</span>
                            <div>
                                <button class="accept-btn">Accept</button>
                                <button class="decline-btn">Decline</button>
                            </div>
                        `;
                reqItem.querySelector('.accept-btn').onclick = () => acceptFriendRequest(req.id, req.from);
                reqItem.querySelector('.decline-btn').onclick = () => declineFriendRequest(req.id);
                friendRequestsList.appendChild(reqItem);
              }
            });
        }
        async function removeFriend(userId) {
          const confirmed = confirm("Are you sure you want to remove this friend?");
          if (!confirmed) return;
          try {
            // Construct the private chat ID
            const privateChatId = [currentUser.uid, userId].sort().join('_');
            // Check for and stop the Realtime Database listener for this specific chat
            if (chatListeners[privateChatId] && Array.isArray(chatListeners[privateChatId])) {
              chatListeners[privateChatId].forEach(listener => {
                if (listener.ref && listener.callback) {
                  listener.ref.off('value', listener.callback);
                }
              });
              delete chatListeners[privateChatId];
            }
            // Delete the chat associated with this friend
            await deleteChat(userId);
            // Remove friend from current user's profile
            await db.collection('profiles').doc(currentUser.uid).update({
              friends: firebase.firestore.FieldValue.arrayRemove(userId)
            });
            // Remove current user from friend's profile
            await db.collection('profiles').doc(userId).update({
              friends: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
            });
            showNotification('Friend and chat removed successfully.');
            // Delay the sidebar refresh to allow the database to update
            setTimeout(() => {
              listenForFriendsAndGroups(); // Re-render the friends list
              currentChatId = null;
              chatPage.style.display = 'none';
              mainSidebar.style.display = 'flex';
            }, 500); // 500ms delay
          } catch (error) {
            showNotification("Failed to remove friend.");
          }
        }
        // CORRECTED FUNCTION:
        async function deleteChat(friendId) {
          const chatIds = [currentUser.uid, friendId].sort();
          const chatId = chatIds.join('_');
          const chatRef = db.collection('chats').doc(chatId);
          // Use .get() to check if the document exists before trying to delete its subcollection
          const chatDoc = await chatRef.get();
          if (chatDoc.exists) {
            // If it exists, proceed to delete the messages subcollection
            const messagesRef = chatRef.collection('messages');
            const snapshot = await messagesRef.get();
            // Delete all messages in the subcollection
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            // Delete the chat document itself
            await chatRef.delete();
          }
        }
        async function acceptFriendRequest(requestId, fromUserId) {
          try {
            const myProfileRef = db.collection('profiles').doc(currentUser.uid);
            const theirProfileRef = db.collection('profiles').doc(fromUserId);
            await db.runTransaction(async (transaction) => {
              const myProfileDoc = await transaction.get(myProfileRef);
              const theirProfileDoc = await transaction.get(theirProfileRef);
              if (!myProfileDoc.exists || !theirProfileDoc.exists) {
                throw "User profiles do not exist!";
              }
              // Use arrayUnion to add the friend ID to both profiles
              transaction.update(myProfileRef, {
                friends: firebase.firestore.FieldValue.arrayUnion(fromUserId)
              });
              transaction.update(theirProfileRef, {
                friends: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
              });
              // Delete the friend request document
              transaction.delete(db.collection('friend_requests').doc(requestId));
            });
            showNotification("Friend request accepted!");
            // Re-render the sidebar after the transaction is complete
            listenForFriendsAndGroups();
          } catch (error) {
            showNotification("Failed to accept friend request. This may be due to a permissions issue.");
          }
        }
        async function declineFriendRequest(requestId) {
          try {
            await db.collection('friend_requests').doc(requestId).delete();
            showNotification("Friend request declined.");
            listenForFriendsAndGroups();
          } catch (error) {
            showNotification("Error declining request.");
          }
        }
        friendRequestsBtn.addEventListener('click', () => {
          if (friendRequestsList.style.display === 'none' || friendRequestsList.style.display === '') {
            friendRequestsList.style.display = 'flex';
          } else {
            friendRequestsList.style.display = 'none';
          }
        });
        async function listenForFriendsAndGroups() {
          // Clean up old listeners
          if (messagesUnsubscribe) messagesUnsubscribe();
          if (typingIndicatorListener) {
            rtdb.ref(`/${currentChatId}/typing`).off('value', typingIndicatorListener);
            typingIndicatorListener = null;
          }
          messagesUnsubscribe = null;
          Object.values(chatListeners).forEach(arr => {
            if (Array.isArray(arr)) {
              arr.forEach(obj => {
                if (obj.ref && obj.callback) obj.ref.off('value', obj.callback);
              });
            }
          });
          chatListeners = {};
          friendsList.innerHTML = '';
          const friends = userData.friends || [];
          const blocked = userData.blocked || [];
          const groups = await db.collection('groups').where('members', 'array-contains', currentUser.uid).get();
          if (friends.length === 0 && groups.empty) {
            friendsList.textContent = "You have no friends or groups yet. Add one above!";
            return;
          }
          // Friends
          for (const friendId of friends) {
            const friendDoc = await db.collection('profiles').doc(friendId).get();
            if (friendDoc.exists) {
              const friendData = friendDoc.data();
              friendsData[friendId] = friendData;
              const isBlocked = blocked.includes(friendId);
              const chatId = [currentUser.uid, friendId].sort().join('_');
              const chatItem = document.createElement('div');
              chatItem.classList.add('user-list-item');
              chatItem.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="online-status offline" data-uid="${friendId}"></span>
                    <span class="unread-dot" style="display:none;"></span>
                    <span>${friendData.username}#${friendData.tag}</span>
                </div>
                <div class="user-list-item-actions">
                    ${isBlocked ?
                        `<span class="material-symbols-rounded action-icon" title="Unblock" onclick="unblockUser('${friendId}')">check</span>` :
                        `<span class="material-symbols-rounded action-icon" title="Block" onclick="blockUser('${friendId}')">block</span>`
                    }
                    <span class="material-symbols-rounded action-icon" title="Remove Friend" onclick="removeFriend('${friendId}')">person_remove</span>
                </div>
            `;
              friendsList.appendChild(chatItem);
              // --- Fix online status dot ---
              const statusDot = chatItem.querySelector('.online-status');
              const statusRef = rtdb.ref(`/status/${friendId}`);
              // Remove previous listener for this friend if exists
              if (chatListeners[chatId]) {
                chatListeners[chatId].forEach(obj => {
                  if (obj.ref && obj.callback) obj.ref.off('value', obj.callback);
                });
              }
              chatListeners[chatId] = [];
              const statusCallback = (snapshot) => {
                try {
                  const status = snapshot.val();
                  statusDot.className = "online-status";
                  if (status && status.isOnline) {
                    statusDot.classList.add('online');
                    statusDot.title = 'Online';
                    statusDot.style.backgroundColor = "#4CAF50";
                  } else {
                    statusDot.classList.add('offline');
                    statusDot.title = 'Offline';
                    statusDot.style.backgroundColor = "grey";
                  }
                  console.log(`Friend ${friendId} status:`, status);
                } catch (err) {
                  console.error('Error in statusCallback:', err);
                }
              };
              statusRef.on('value', statusCallback, (err) => {
                console.error('RTDB permission error:', err);
              });
              chatListeners[chatId].push({
                ref: statusRef,
                callback: statusCallback
              });
              // Unread dot
              const unreadDot = chatItem.querySelector('.unread-dot');
              unreadDot.innerHTML = '<span></span>';
              const unreadNumSpan = unreadDot.querySelector('span');
              const lastReadKey = `lastRead_${chatId}`;
              db.collection('chats').doc(chatId).collection('messages')
                .orderBy('timestamp')
                .onSnapshot(snap => {
                  let lastRead = Number(localStorage.getItem(lastReadKey) || 0);
                  let unread = 0;
                  snap.docs.forEach(doc => {
                    const msg = doc.data();
                    if (
                      msg.senderId !== currentUser.uid &&
                      msg.timestamp &&
                      msg.timestamp.toMillis() > lastRead
                    ) {
                      unread++;
                    }
                  });
                  unreadCounts[chatId] = unread;
                  updateUnreadTitle();
                  if (unread > 0) {
                    unreadDot.style.display = 'flex';
                    unreadNumSpan.textContent = unread;
                  } else {
                    unreadDot.style.display = 'none';
                    unreadNumSpan.textContent = '';
                  }
                });
              chatItem.addEventListener('click', () => {
                localStorage.setItem(lastReadKey, Date.now());
                unreadCounts[chatId] = 0;
                updateUnreadTitle();
                unreadDot.style.display = 'none';
                unreadDot.querySelector('span').textContent = '';
                openChat(chatId, 'private', friendId, friendData.username);
              });
            }
          }
          // Groups
          groups.forEach(groupDoc => {
            const groupData = groupDoc.data();
            const chatId = groupDoc.id;
            const chatItem = document.createElement('div');
            chatItem.classList.add('user-list-item');
            chatItem.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span class="material-symbols-rounded">group</span>
                <span class="unread-dot" style="display:none;"></span>
                <span>${groupData.name}</span>
            </div>
        `;
            friendsList.appendChild(chatItem);
            const unreadDot = chatItem.querySelector('.unread-dot');
            unreadDot.innerHTML = '<span></span>';
            const unreadNumSpan = unreadDot.querySelector('span');
            const lastReadKey = `lastRead_${chatId}`;
            db.collection('chats').doc(chatId).collection('messages')
              .orderBy('timestamp')
              .onSnapshot(snap => {
                let lastRead = Number(localStorage.getItem(lastReadKey) || 0);
                let unread = 0;
                snap.docs.forEach(doc => {
                  const msg = doc.data();
                  if (
                    msg.senderId !== currentUser.uid &&
                    msg.timestamp &&
                    msg.timestamp.toMillis() > lastRead
                  ) {
                    unread++;
                  }
                });
                unreadCounts[chatId] = unread;
                updateUnreadTitle();
                if (unread > 0) {
                  unreadDot.style.display = 'flex';
                  unreadNumSpan.textContent = unread;
                } else {
                  unreadDot.style.display = 'none';
                  unreadNumSpan.textContent = '';
                }
              });
            chatItem.addEventListener('click', () => {
              localStorage.setItem(lastReadKey, Date.now());
              unreadCounts[chatId] = 0;
              updateUnreadTitle();
              unreadDot.style.display = 'none';
              unreadDot.querySelector('span').textContent = '';
              openChat(chatId, 'group', null, groupData.name);
            });
          });
          listenForBlockedUsers();
        }

        function listenForBlockedUsers() {
          if (chatListeners.blocked) chatListeners.blocked();
          chatListeners.blocked = db.collection('profiles').doc(currentUser.uid).onSnapshot(doc => {
            const profile = doc.data();
            blockedData = profile.blocked || [];
            const blockedList = document.getElementById('blocked-users-list');
            blockedList.innerHTML = '';
            if (blockedData.length > 0) {
              blockedData.forEach(async (blockedId) => {
                const blockedDoc = await db.collection('profiles').doc(blockedId).get();
                if (blockedDoc.exists) {
                  const blockedUser = blockedDoc.data();
                  const blockedItem = document.createElement('div');
                  blockedItem.classList.add('blocked-user-item');
                  blockedItem.innerHTML = `
                                <span>${blockedUser.username}#${blockedUser.tag}</span>
                                <button class="unblock-btn">Unblock</button>
                            `;
                  blockedItem.querySelector('.unblock-btn').onclick = () => unblockUser(blockedId);
                  blockedList.appendChild(blockedItem);
                }
              });
            } else {
              blockedList.textContent = "No blocked users.";
            }
          });
        }
        toggleBlockedBtn.addEventListener('click', () => {
          if (blockedUsersList.style.display === 'none' || blockedUsersList.style.display === '') {
            blockedUsersList.style.display = 'flex';
            toggleBlockedBtn.textContent = "Hide Blocked Users";
          } else {
            blockedUsersList.style.display = 'none';
            toggleBlockedBtn.textContent = "Show Blocked Users";
          }
        });
        async function blockUser(userId) {
          try {
            await db.collection('profiles').doc(currentUser.uid).update({
              blocked: firebase.firestore.FieldValue.arrayUnion(userId)
            });
            await db.collection('profiles').doc(userId).update({
              friends: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
            });
            await db.collection('profiles').doc(currentUser.uid).update({
              friends: firebase.firestore.FieldValue.arrayRemove(userId)
            });
            showNotification('User blocked and removed from friends.');
            backToSidebarBtn.click();
          } catch (error) {
            showNotification("Error blocking user.");
          }
        }
        async function unblockUser(userId) {
          try {
            await db.collection('profiles').doc(currentUser.uid).update({
              blocked: firebase.firestore.FieldValue.arrayRemove(userId)
            });
            showNotification('User unblocked.');
            backToSidebarBtn.click();
          } catch (error) {
            showNotification("Error unblocking user.");
          }
        }
        async function acceptFriendRequest(requestId, fromUserId) {
          try {
            const myProfileRef = db.collection('profiles').doc(currentUser.uid);
            const theirProfileRef = db.collection('profiles').doc(fromUserId);
            await myProfileRef.update({
              friends: firebase.firestore.FieldValue.arrayUnion(fromUserId)
            });
            await theirProfileRef.update({
              friends: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
            });
            await db.collection('friend_requests').doc(requestId).delete();
            showNotification("Friend request accepted!");
          } catch (error) {
            showNotification("Failed to accept friend request. This may be due to a permissions issue.");
          }
        }
        async function openChat(chatId, type, memberId, name) {
          // Detach old listeners
          if (messagesUnsubscribe) {
            messagesUnsubscribe();
            messagesUnsubscribe = null;
          }
          if (typingIndicatorListener) {
            rtdb.ref(`/${currentChatId}/typing`).off('value', typingIndicatorListener);
            typingIndicatorListener = null;
          }
          currentChatId = chatId;
          currentChatType = type;
          chatPage.style.display = 'flex';
          messageInput.disabled = false;
          sendBtn.disabled = false;
          messageInput.placeholder = "Type a message...";
          currentChatInfo.textContent = name;
          leaveGroupBtn.style.display = 'none';
          groupSettingsBtn.style.display = 'none';
          currentGroupData = null;
          if (type === 'group') {
            const groupDoc = await db.collection('groups').doc(chatId).get();
            if (groupDoc.exists) {
              currentGroupData = groupDoc.data();
              leaveGroupBtn.style.display = 'block';
              if (currentGroupData.ownerId === currentUser.uid) {
                groupSettingsBtn.style.display = 'block';
              }
            }
          }
          chatMessages.innerHTML = '';
          // --- Typing Indicator Listener ---
          const typingRef = rtdb.ref(`/${chatId}/typing`);
          typingIndicatorListener = typingRef.on('value', (snapshot) => {
            const typingUsers = snapshot.val() || {};
            let validTypingUsers = [];
            if (type === 'private') {
              validTypingUsers = Object.keys(typingUsers).filter(uid =>
                uid !== currentUser.uid && friendsData[uid]
              );
            } else if (type === 'group' && currentGroupData) {
              validTypingUsers = Object.keys(typingUsers).filter(uid =>
                uid !== currentUser.uid && currentGroupData.members.includes(uid)
              );
            }
            if (validTypingUsers.length > 0) {
              let typingNames = validTypingUsers.map(uid =>
                friendsData[uid]?.username || 'Someone'
              );
              typingIndicator.textContent = `${typingNames.join(', ')} is typing...`;
              typingIndicator.style.display = 'block';
            } else {
              typingIndicator.style.display = 'none';
            }
          });
          // --- Messages Listener ---
          const chatCollection = db.collection('chats').doc(chatId).collection('messages');
          messagesUnsubscribe = chatCollection.orderBy('timestamp').onSnapshot(snapshot => {
            chatMessages.innerHTML = '';
            snapshot.docs.forEach(doc => displayMessage(doc.data(), doc.id));
            // --- Auto-scroll after DOM update ---
            setTimeout(() => {
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 0);
          });
        }
        backToSidebarBtn.addEventListener('click', () => {
          if (messagesUnsubscribe) messagesUnsubscribe();
          if (typingIndicatorListener) {
            rtdb.ref(`/${currentChatId}/typing`).off('value', typingIndicatorListener);
          }
          messagesUnsubscribe = null;
          typingIndicatorListener = null;
          currentChatId = null;
          chatPage.style.display = 'none';
          updateUnreadTitle(); // Update title when leaving chat
        });
        // --- IMAGE HANDLING LOGIC ---
        async function compressImage(file, maxWidth) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(event) {
              const img = new Image();
              img.onload = function() {
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                  height = height * (maxWidth / width);
                  width = maxWidth;
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                canvas.toBlob(blob => {
                  resolve(blob);
                }, file.type, 0.8);
              };
              img.src = event.target.result;
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
          });
        }
        async function processImageForMessage(file) {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(event) {
              resolve(event.target.result);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
          });
        }
        imageUploadBtn.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (file) {
            uploadedImageFile = file;
            const compressedBlob = await compressImage(file, 400);
            const dataUrl = URL.createObjectURL(compressedBlob);
            imageThumbnail.src = dataUrl;
            imagePreviewDiv.style.display = 'flex';
          }
        });
        clearImageBtn.addEventListener('click', () => {
          uploadedImageFile = null;
          imagePreviewDiv.style.display = 'none';
          imageUploadBtn.value = '';
        });
        messageInput.addEventListener('paste', async (e) => {
          const items = (e.clipboardData || e.originalEvent.clipboardData).items;
          for (const item of items) {
            if (item.kind === 'file') {
              const blob = item.getAsFile();
              if (blob.type.startsWith('image/')) {
                uploadedImageFile = blob;
                e.preventDefault();
                const compressedBlob = await compressImage(blob, 400);
                const dataUrl = URL.createObjectURL(compressedBlob);
                imageThumbnail.src = dataUrl;
                imagePreviewDiv.style.display = 'flex';
                break;
              }
            }
          }
        });
        sendBtn.addEventListener('click', async () => {
          const messageText = messageInput.value.trim();
          if (!messageText && !uploadedImageFile) return;
          if (!currentChatId) return;
          let fullMessageContent = messageText;
          try {
            if (uploadedImageFile) {
              const compressedBlob = await compressImage(uploadedImageFile, 400);
              const imageBase64 = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(compressedBlob);
              });
              const imageTag = `![](${imageBase64})`;
              fullMessageContent = messageText ? `${messageText}\n${imageTag}` : imageTag;
            }
            const newMessage = {
              content: fullMessageContent,
              timestamp: firebase.firestore.FieldValue.serverTimestamp(),
              senderId: currentUser.uid,
              senderName: userData.username,
              senderColor: userData.bubbleColor,
            };
            const chatRef = db.collection('chats').doc(currentChatId).collection('messages');
            await chatRef.add(newMessage);
            messageInput.value = '';
            uploadedImageFile = null;
            imagePreviewDiv.style.display = 'none';
            imageUploadBtn.value = '';
            setTypingStatus(false);
          } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message: " + error.message);
          }
        });

        function displayMessage(data, messageId) {
          const isSent = data.senderId === currentUser.uid;
          const messageContainer = document.createElement('div');
          messageContainer.classList.add('message-container');
          const messageElement = document.createElement('div');
          messageElement.classList.add('message');
          if (isSent) {
            messageElement.classList.add('sent');
          } else {
            messageElement.classList.add('received');
          }
          const bubble = document.createElement('div');
          bubble.classList.add('message-bubble');
          if (isSent) {
            bubble.style.backgroundColor = data.senderColor || userData.bubbleColor;
          } else {
            bubble.style.backgroundColor = friendsData[data.senderId]?.bubbleColor || 'var(--bubble-bg-received)';
          }
          // --- Show sender info and timestamp (NO online-status dot here) ---
          if (!isSent) {
            const infoDiv = document.createElement('div');
            infoDiv.classList.add('message-info');
            const usernameSpan = document.createElement('span');
            usernameSpan.classList.add('username');
            usernameSpan.textContent = data.senderName;
            // Timestamp formatting (HH:MM)
            let timeStr = '';
            if (data.timestamp && typeof data.timestamp.toDate === 'function') {
              const date = data.timestamp.toDate();
              const hours = date.getHours().toString().padStart(2, '0');
              const minutes = date.getMinutes().toString().padStart(2, '0');
              timeStr = `${hours}:${minutes}`;
            }
            const timestampSpan = document.createElement('span');
            timestampSpan.classList.add('timestamp');
            timestampSpan.textContent = timeStr;
            infoDiv.appendChild(usernameSpan);
            infoDiv.appendChild(timestampSpan);
            messageContainer.appendChild(infoDiv);
          }
          // Parse images and markdown
          const imageRegex = /!\[\]\((data:image\/[a-zA-Z0-9\-\+\/\=]+)\)/g;
          const content = data.content;
          let lastIndex = 0;
          let match;
          const tempDiv = document.createElement('div');
          while ((match = imageRegex.exec(content)) !== null) {
            const preText = content.substring(lastIndex, match.index).trim();
            if (preText) {
              const textElement = document.createElement('div');
              textElement.innerHTML = marked.parse(preText);
              tempDiv.appendChild(textElement);
            }
            const imageData = match[1];
            const imageElement = document.createElement('img');
            imageElement.src = imageData;
            imageElement.classList.add('message-image');
            tempDiv.appendChild(imageElement);
            lastIndex = imageRegex.lastIndex;
          }
          const remainingText = content.substring(lastIndex).trim();
          if (remainingText) {
            const textElement = document.createElement('div');
            textElement.innerHTML = marked.parse(remainingText);
            tempDiv.appendChild(textElement);
          }
          bubble.appendChild(tempDiv);
          messageElement.appendChild(bubble);
          messageContainer.appendChild(messageElement);
          chatMessages.appendChild(messageContainer);
          // --- Always scroll to the bottom after adding a message ---
          setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
          }, 0);
        }
        async function openChat(chatId, type, memberId, name) {
          // Detach old listeners
          if (messagesUnsubscribe) {
            messagesUnsubscribe();
            messagesUnsubscribe = null;
          }
          if (typingIndicatorListener) {
            rtdb.ref(`/${currentChatId}/typing`).off('value', typingIndicatorListener);
            typingIndicatorListener = null;
          }
          currentChatId = chatId;
          currentChatType = type;
          chatPage.style.display = 'flex';
          messageInput.disabled = false;
          sendBtn.disabled = false;
          messageInput.placeholder = "Type a message...";
          currentChatInfo.textContent = name;
          leaveGroupBtn.style.display = 'none';
          groupSettingsBtn.style.display = 'none';
          currentGroupData = null;
          if (type === 'group') {
            const groupDoc = await db.collection('groups').doc(chatId).get();
            if (groupDoc.exists) {
              currentGroupData = groupDoc.data();
              leaveGroupBtn.style.display = 'block';
              if (currentGroupData.ownerId === currentUser.uid) {
                groupSettingsBtn.style.display = 'block';
              }
            }
          }
          chatMessages.innerHTML = '';
          // --- Typing Indicator Listener ---
          const typingRef = rtdb.ref(`/${chatId}/typing`);
          typingIndicatorListener = typingRef.on('value', (snapshot) => {
            const typingUsers = snapshot.val() || {};
            let validTypingUsers = [];
            if (type === 'private') {
              validTypingUsers = Object.keys(typingUsers).filter(uid =>
                uid !== currentUser.uid && friendsData[uid]
              );
            } else if (type === 'group' && currentGroupData) {
              validTypingUsers = Object.keys(typingUsers).filter(uid =>
                uid !== currentUser.uid && currentGroupData.members.includes(uid)
              );
            }
            if (validTypingUsers.length > 0) {
              let typingNames = validTypingUsers.map(uid =>
                friendsData[uid]?.username || 'Someone'
              );
              typingIndicator.textContent = `${typingNames.join(', ')} is typing...`;
              typingIndicator.style.display = 'block';
            } else {
              typingIndicator.style.display = 'none';
            }
          });
          // --- Messages Listener ---
          const chatCollection = db.collection('chats').doc(chatId).collection('messages');
          messagesUnsubscribe = chatCollection.orderBy('timestamp').onSnapshot(snapshot => {
            chatMessages.innerHTML = '';
            snapshot.docs.forEach(doc => displayMessage(doc.data(), doc.id));
            // --- Auto-scroll after DOM update ---
            setTimeout(() => {
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 0);
          });
        }
        // --- GROUP CHAT LOGIC ---
        createGroupBtn.addEventListener('click', async () => {
          createGroupModal.style.display = 'flex';
          groupFriendsList.innerHTML = '';
          const friendIds = userData.friends || [];
          for (const friendId of friendIds) {
            const friendDoc = await db.collection('profiles').doc(friendId).get();
            if (friendDoc.exists) {
              const friendData = friendDoc.data();
              const friendItem = document.createElement('label');
              friendItem.classList.add('friend-item');
              friendItem.innerHTML = `
                        <input type="checkbox" data-id="${friendId}">
                        <span>${friendData.username}#${friendData.tag}</span>
                    `;
              groupFriendsList.appendChild(friendItem);
            }
          }
        });
        confirmCreateGroupBtn.addEventListener('click', async () => {
          const groupName = groupNameInput.value.trim();
          const selectedMembers = Array.from(document.querySelectorAll('#group-friends-list input:checked')).map(input => input.dataset.id);
          if (!groupName) {
            showNotification("Please enter a group name.");
            return;
          }
          if (selectedMembers.length === 0) {
            showNotification("Please select at least one friend to create a group.");
            return;
          }
          const members = [currentUser.uid, ...selectedMembers];
          try {
            const groupRef = db.collection('groups').doc();
            await groupRef.set({
              name: groupName,
              members: members,
              ownerId: currentUser.uid,
              createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showNotification(`Group "${groupName}" created successfully!`);
            createGroupModal.style.display = 'none';
            groupNameInput.value = '';
            // Immediately set currentGroupData and open the chat
            currentGroupData = {
              name: groupName,
              members: members,
              ownerId: currentUser.uid
            };
            listenForFriendsAndGroups();
            openChat(groupRef.id, 'group', null, groupName);
          } catch (error) {
            console.error("Error creating group:", error);
            showNotification("Failed to create group.");
          }
        });
        cancelCreateGroupBtn.addEventListener('click', () => {
          createGroupModal.style.display = 'none';
          groupNameInput.value = '';
        });
        leaveGroupBtn.addEventListener('click', async () => {
          const confirmed = confirm("Are you sure you want to leave this group?");
          if (!confirmed) return;
          try {
            await db.collection('groups').doc(currentChatId).update({
              members: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
            });
            showNotification("You have left the group.");
            backToSidebarBtn.click();
            listenForFriendsAndGroups(); // Add this line to refresh the sidebar
          } catch (error) {
            showNotification("Error leaving group.");
          }
        });
        // --- NEW GROUP SETTINGS LOGIC ---
        groupSettingsBtn.addEventListener('click', () => {
          if (currentChatType === 'group' && currentGroupData && currentGroupData.ownerId === currentUser.uid) {
            groupSettingsTitle.textContent = `${currentGroupData.name} Settings`;
            groupSettingsModal.style.display = 'flex';
          }
        });
        closeSettingsModalBtn.addEventListener('click', () => {
          groupSettingsModal.style.display = 'none';
        });
        addMemberBtn.addEventListener('click', async () => {
          groupSettingsModal.style.display = 'none';
          addMemberModal.style.display = 'flex';
          addMemberFriendsList.innerHTML = '';
          const existingMembers = currentGroupData.members;
          const friends = userData.friends || [];
          for (const friendId of friends) {
            if (!existingMembers.includes(friendId)) {
              const friendDoc = await db.collection('profiles').doc(friendId).get();
              if (friendDoc.exists) {
                const friendData = friendDoc.data();
                const friendItem = document.createElement('label');
                friendItem.classList.add('friend-item');
                friendItem.innerHTML = `
                            <input type="checkbox" data-id="${friendId}">
                            <span>${friendData.username}#${friendData.tag}</span>
                        `;
                addMemberFriendsList.appendChild(friendItem);
              }
            }
          }
          if (addMemberFriendsList.children.length === 0) {
            addMemberFriendsList.textContent = "All your friends are already in this group.";
          }
        });
        confirmAddMembersBtn.addEventListener('click', async () => {
          const selectedMembers = Array.from(document.querySelectorAll('#add-member-friends-list input:checked')).map(input => input.dataset.id);
          if (selectedMembers.length === 0) {
            showNotification("Please select at least one friend to add.");
            return;
          }
          try {
            await db.collection('groups').doc(currentChatId).update({
              members: firebase.firestore.FieldValue.arrayUnion(...selectedMembers)
            });
            showNotification("Members added successfully!");
            addMemberModal.style.display = 'none';
            // Re-open chat to update info
            openChat(currentChatId, 'group', null, currentGroupData.name);
          } catch (error) {
            showNotification("Failed to add members.");
          }
        });
        cancelAddMembersBtn.addEventListener('click', () => {
          addMemberModal.style.display = 'none';
        });
        deleteGroupBtn.addEventListener('click', async () => {
          const confirmed = confirm("Are you sure you want to delete this group? This action is permanent.");
          if (!confirmed) return;
          try {
            // Delete all messages in the chat
            const messagesSnapshot = await db.collection('chats').doc(currentChatId).collection('messages').get();
            const batch = db.batch();
            messagesSnapshot.docs.forEach(doc => {
              batch.delete(doc.ref);
            });
            await batch.commit();
            // Delete the chat document itself
            await db.collection('chats').doc(currentChatId).delete();
            // Delete the group document
            await db.collection('groups').doc(currentChatId).delete();
            showNotification("Group deleted successfully.");
            backToSidebarBtn.click();
          } catch (error) {
            showNotification("Failed to delete group.");
          }
        });
        transferOwnerBtn.addEventListener('click', async () => {
          groupSettingsModal.style.display = 'none';
          transferOwnershipModal.style.display = 'flex';
          transferOwnerList.innerHTML = '';
          const currentMembers = currentGroupData.members;
          for (const memberId of currentMembers) {
            if (memberId !== currentUser.uid) {
              const memberDoc = await db.collection('profiles').doc(memberId).get();
              if (memberDoc.exists) {
                const memberData = memberDoc.data();
                const memberItem = document.createElement('label');
                memberItem.classList.add('friend-item');
                memberItem.innerHTML = `
                            <input type="radio" name="new-owner" data-id="${memberId}">
                            <span>${memberData.username}#${memberData.tag}</span>
                        `;
                transferOwnerList.appendChild(memberItem);
              }
            }
          }
          if (transferOwnerList.children.length === 0) {
            transferOwnerList.textContent = "No other members to transfer ownership to.";
            confirmTransferBtn.disabled = true;
          } else {
            confirmTransferBtn.disabled = false;
          }
        });
        confirmTransferBtn.addEventListener('click', async () => {
          const newOwnerId = document.querySelector('#transfer-owner-list input:checked')?.dataset.id;
          if (!newOwnerId) {
            showNotification("Please select a new owner.");
            return;
          }
          try {
            await db.collection('groups').doc(currentChatId).update({
              ownerId: newOwnerId
            });
            showNotification("Ownership transferred successfully.");
            transferOwnershipModal.style.display = 'none';
            backToSidebarBtn.click();
          } catch (error) {
            showNotification("Failed to transfer ownership.");
          }
        });
        cancelTransferBtn.addEventListener('click', () => {
          transferOwnershipModal.style.display = 'none';
        });
        saveColorBtn.addEventListener('click', async () => {
          const newColor = bubbleColorPicker.value;
          try {
            await db.collection('profiles').doc(currentUser.uid).update({
              bubbleColor: newColor
            });
            showNotification("Color saved successfully!");
          } catch (error) {
            showNotification("Failed to save color.");
          }
        });
        document.getElementById('modal-save-color-btn').addEventListener('click', async () => {
          const newColor = document.getElementById('modal-bubble-color-picker').value;
          try {
            await db.collection('profiles').doc(currentUser.uid).update({
              bubbleColor: newColor
            });
            bubbleColorPicker.value = newColor;
            showNotification('Color saved successfully!');
            document.getElementById('user-settings-modal').style.display = 'none';
          } catch (error) {
            showNotification('Failed to save color.');
          }
        });
        // --- Typing Indicator Fix ---
        async function openChat(chatId, type, memberId, name) {
          // --- Detach old listeners ---
          if (messagesUnsubscribe) {
            messagesUnsubscribe();
            messagesUnsubscribe = null;
          }
          if (typingIndicatorListener) {
            rtdb.ref(`/${currentChatId}/typing`).off('value', typingIndicatorListener);
            typingIndicatorListener = null;
          }
          currentChatId = chatId;
          currentChatType = type;
          chatPage.style.display = 'flex';
          messageInput.disabled = false;
          sendBtn.disabled = false;
          messageInput.placeholder = "Type a message...";
          currentChatInfo.textContent = name;
          leaveGroupBtn.style.display = 'none';
          groupSettingsBtn.style.display = 'none';
          currentGroupData = null;
          if (type === 'group') {
            const groupDoc = await db.collection('groups').doc(chatId).get();
            if (groupDoc.exists) {
              currentGroupData = groupDoc.data();
              leaveGroupBtn.style.display = 'block';
              if (currentGroupData.ownerId === currentUser.uid) {
                groupSettingsBtn.style.display = 'block';
              }
            }
          }
          chatMessages.innerHTML = '';
          // --- Typing Indicator Listener ---
          const typingRef = rtdb.ref(`/${chatId}/typing`);
          typingIndicatorListener = typingRef.on('value', (snapshot) => {
            const typingUsers = snapshot.val() || {};
            let validTypingUsers = [];
            if (type === 'private') {
              validTypingUsers = Object.keys(typingUsers).filter(uid =>
                uid !== currentUser.uid && friendsData[uid]
              );
            } else if (type === 'group' && currentGroupData) {
              validTypingUsers = Object.keys(typingUsers).filter(uid =>
                uid !== currentUser.uid && currentGroupData.members.includes(uid)
              );
            }
            if (validTypingUsers.length > 0) {
              let typingNames = validTypingUsers.map(uid =>
                friendsData[uid]?.username || 'Someone'
              );
              typingIndicator.textContent = `${typingNames.join(', ')} is typing...`;
              typingIndicator.style.display = 'block';
            } else {
              typingIndicator.style.display = 'none';
            }
          });
          // --- Messages Listener ---
          const chatCollection = db.collection('chats').doc(chatId).collection('messages');
          messagesUnsubscribe = chatCollection.orderBy('timestamp').onSnapshot(snapshot => {
            chatMessages.innerHTML = '';
            snapshot.docs.forEach(doc => displayMessage(doc.data(), doc.id));
            // --- Auto-scroll after DOM update ---
            setTimeout(() => {
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 0);
          });
        }
        // --- Notification Modal Logic ---
        function showNotification(message) {
          document.getElementById('notification-modal-message').textContent = message;
          document.getElementById('notification-modal').style.display = 'flex';
        }
        document.getElementById('notification-modal-close-btn').onclick = function() {
          document.getElementById('notification-modal').style.display = 'none';
        };
        // Add missing setTypingStatus function
        function setTypingStatus(isTyping) {
          if (!currentUser || !currentChatId) return;
          const typingRef = rtdb.ref(`/${currentChatId}/typing/${currentUser.uid}`);
          if (isTyping) {
            typingRef.set(true);
          } else {
            typingRef.remove();
          }
        }

        function setupOnlinePresence() {
          if (!currentUser) return;
          const uid = currentUser.uid;
          const userStatusDatabaseRef = rtdb.ref('/status/' + uid);
          const connectedRef = rtdb.ref('.info/connected');
          connectedRef.on('value', (snapshot) => {
            console.log('RTDB .info/connected:', snapshot.val());
            if (snapshot.val() === true) {
              userStatusDatabaseRef.onDisconnect().set({
                isOnline: false,
                last_changed: firebase.database.ServerValue.TIMESTAMP
              });
              userStatusDatabaseRef.set({
                isOnline: true,
                last_changed: firebase.database.ServerValue.TIMESTAMP
              });
              console.log('setupOnlinePresence: set online for', uid);
            }
          });
        }
