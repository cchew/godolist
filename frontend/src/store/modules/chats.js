export default {
  namespaced: true,
  
  state: {
    chats: [
      {
        id: 'chat1',
        name: 'Code Review Discussion',
        lastMessage: 'I can help you review the authentication implementation.',
        timestamp: '2024-03-15T10:30:00',
        messages: [
          {
            id: 'msg1',
            role: 'user',
            content: 'I need help reviewing my authentication implementation. Can you help me check if there are any security issues?',
            timestamp: '2024-03-15T10:30:00'
          },
          {
            id: 'msg2',
            role: 'assistant',
            content: 'I\'d be happy to help review your authentication implementation. To provide a thorough security assessment, could you share the relevant code snippets or specific areas you\'d like me to focus on?',
            timestamp: '2024-03-15T10:30:30'
          },
          {
            id: 'msg3',
            role: 'user',
            content: 'Here\'s my login function:\n```javascript\nasync function login(email, password) {\n  const hashedPassword = md5(password);\n  const user = await db.users.findOne({ email, password: hashedPassword });\n  if (user) {\n    const token = jwt.sign({ userId: user.id }, \'secret-key\');\n    return { token };\n  }\n  throw new Error(\'Invalid credentials\');\n}```',
            timestamp: '2024-03-15T10:31:00'
          },
          {
            id: 'msg4',
            role: 'assistant',
            content: 'I\'ve reviewed your login implementation and found several security concerns that should be addressed:\n\n1. **Password Hashing**: You\'re using MD5, which is cryptographically broken. Instead, use a secure hashing algorithm like bcrypt:\n```javascript\nconst bcrypt = require(\'bcrypt\');\nconst hashedPassword = await bcrypt.hash(password, 10);\n```\n\n2. **JWT Secret**: The secret key is hardcoded. Use an environment variable:\n```javascript\nconst token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);\n```\n\n3. **Timing Attacks**: The current implementation might be vulnerable to timing attacks. Consider using a constant-time comparison function.\n\nWould you like me to provide a more secure version of this function?',
            timestamp: '2024-03-15T10:31:45'
          },
          {
            id: 'msg5',
            role: 'user',
            content: 'Yes, please show me the improved version with all the security fixes.',
            timestamp: '2024-03-15T10:32:15'
          },
          {
            id: 'msg6',
            role: 'assistant',
            content: 'Here\'s a more secure version of your login function:\n\n```javascript\nconst bcrypt = require(\'bcrypt\');\nconst jwt = require(\'jsonwebtoken\');\nconst { promisify } = require(\'util\');\n\nasync function login(email, password) {\n  try {\n    // Input validation\n    if (!email || !password) {\n      throw new Error(\'Email and password are required\');\n    }\n\n    // Find user by email only (not password)\n    const user = await db.users.findOne({ email });\n    \n    // Use constant-time comparison\n    if (!user || !(await bcrypt.compare(password, user.password))) {\n      throw new Error(\'Invalid credentials\');\n    }\n\n    // Generate JWT with expiration\n    const token = await promisify(jwt.sign)(\n      { \n        userId: user.id,\n        version: user.tokenVersion // For token invalidation\n      },\n      process.env.JWT_SECRET,\n      { expiresIn: \'1h\' }\n    );\n\n    return { \n      token,\n      expiresIn: 3600 // 1 hour in seconds\n    };\n  } catch (error) {\n    // Log error securely (without exposing sensitive data)\n    console.error(\'Login error:\', error.message);\n    throw new Error(\'Invalid credentials\');\n  }\n}\n```\n\nKey security improvements:\n1. Secure password hashing with bcrypt\n2. Environment variable for JWT secret\n3. Constant-time password comparison\n4. Input validation\n5. Token expiration\n6. Error handling without information leakage\n7. Token versioning for invalidation\n\nDon\'t forget to:\n1. Set up proper environment variables\n2. Implement rate limiting\n3. Use HTTPS\n4. Add request validation middleware\n\nWould you like me to explain any of these improvements in more detail?',
            timestamp: '2024-03-15T10:33:00'
          }
        ]
      },
      {
        id: 'chat2',
        name: 'API Design Discussion',
        lastMessage: 'Here\'s a more RESTful approach to your API endpoints.',
        timestamp: '2024-03-14T15:45:00',
        messages: [
          {
            id: 'msg1',
            role: 'user',
            content: 'I\'m designing a new API for a blog platform. Here are my current endpoints:\n- /createPost\n- /editPost\n- /deletePost\n- /getPosts\n\nDoes this look good?',
            timestamp: '2024-03-14T15:45:00'
          },
          {
            id: 'msg2',
            role: 'assistant',
            content: 'Your API endpoints could be more RESTful. Here\'s a suggested improvement:\n\nInstead of using verbs in the URLs, use HTTP methods to indicate the action:\n\n```\nPOST /posts           # Create a new post\nGET /posts            # List all posts\nGET /posts/:id        # Get a specific post\nPUT /posts/:id        # Update a post\nDELETE /posts/:id     # Delete a post\n```\n\nThis follows REST conventions better because:\n1. Uses nouns instead of verbs\n2. Uses HTTP methods semantically\n3. Follows resource hierarchy\n4. More predictable for API consumers\n\nWould you like me to suggest some query parameters for filtering and pagination?',
            timestamp: '2024-03-14T15:46:00'
          },
          {
            id: 'msg3',
            role: 'user',
            content: 'Yes, that would be helpful! Also, what about endpoints for comments on posts?',
            timestamp: '2024-03-14T15:47:00'
          },
          {
            id: 'msg4',
            role: 'assistant',
            content: 'Here\'s the complete API design including comments and query parameters:\n\n**Posts Endpoints:**\n```\n# Posts with query parameters\nGET /posts?page=1&limit=10&sort=date&order=desc\nGET /posts?author=123&status=published\n\n# Basic CRUD\nPOST /posts\nGET /posts/:id\nPUT /posts/:id\nDELETE /posts/:id\n```\n\n**Comments Endpoints (as a nested resource):**\n```\n# List comments for a post\nGET /posts/:postId/comments\n\n# Add a comment to a post\nPOST /posts/:postId/comments\n\n# Manage specific comment\nGET /posts/:postId/comments/:commentId\nPUT /posts/:postId/comments/:commentId\nDELETE /posts/:postId/comments/:commentId\n```\n\n**Query Parameters:**\n- `page`: Page number (default: 1)\n- `limit`: Items per page (default: 10)\n- `sort`: Field to sort by (date, title, etc.)\n- `order`: Sort order (asc/desc)\n- `author`: Filter by author ID\n- `status`: Filter by post status\n- `search`: Search in title/content\n\nWould you like me to provide example response formats as well?',
            timestamp: '2024-03-14T15:48:00'
          }
        ]
      },
      {
        id: 'chat3',
        name: 'Performance Optimization',
        lastMessage: 'Let\'s analyze your React component\'s render performance.',
        timestamp: '2024-03-13T09:15:00',
        messages: [
          {
            id: 'msg1',
            role: 'user',
            content: 'My React app is rendering slowly. Here\'s my component:\n```jsx\nfunction UserList({ users }) {\n  const [filter, setFilter] = useState(\'\');\n  \n  const filteredUsers = users.filter(user => \n    user.name.toLowerCase().includes(filter.toLowerCase())\n  );\n  \n  return (\n    <div>\n      <input \n        type="text" \n        value={filter} \n        onChange={e => setFilter(e.target.value)} \n      />\n      {filteredUsers.map(user => (\n        <UserCard key={user.id} user={user} />\n      ))}\n    </div>\n  );\n}```',
            timestamp: '2024-03-13T09:15:00'
          },
          {
            id: 'msg2',
            role: 'assistant',
            content: 'I notice a few performance issues in your component:\n\n1. The `filteredUsers` calculation runs on every render\n2. No memoization for expensive operations\n3. Potential unnecessary re-renders of UserCard\n\nHere\'s the optimized version:\n\n```jsx\nimport { useState, useMemo, useCallback } from \'react\';\n\nconst UserCard = React.memo(({ user }) => {\n  return (\n    <div className="user-card">\n      <h3>{user.name}</h3>\n      {/* other user details */}\n    </div>\n  );\n});\n\nfunction UserList({ users }) {\n  const [filter, setFilter] = useState(\'\');\n  \n  const filteredUsers = useMemo(() => \n    users.filter(user => \n      user.name.toLowerCase().includes(filter.toLowerCase())\n    ),\n    [users, filter]\n  );\n  \n  const handleFilterChange = useCallback(e => {\n    setFilter(e.target.value);\n  }, []);\n  \n  return (\n    <div>\n      <input \n        type="text" \n        value={filter} \n        onChange={handleFilterChange} \n      />\n      {filteredUsers.map(user => (\n        <UserCard key={user.id} user={user} />\n      ))}\n    </div>\n  );\n}\n```\n\nImprovements made:\n1. Used `useMemo` for filtered users calculation\n2. Memoized the UserCard component with `React.memo`\n3. Used `useCallback` for the onChange handler\n\nWould you like me to explain these optimizations in more detail or suggest additional performance improvements?',
            timestamp: '2024-03-13T09:16:00'
          }
        ]
      }
    ]
  },
  
  getters: {
    allChats: state => state.chats,
    getChatById: state => id => state.chats.find(chat => chat.id === id)
  },
  
  mutations: {
    addMessage(state, { chatId, message }) {
      const chat = state.chats.find(c => c.id === chatId)
      if (chat) {
        chat.messages.push(message)
        chat.lastMessage = message.content
        chat.timestamp = message.timestamp
      }
    }
  },
  
  actions: {
    sendMessage({ commit }, { chatId, message }) {
      commit('addMessage', { chatId, message })
    }
  }
} 