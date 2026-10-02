This repository is a monorepo containing two separate projects: **frontend** and **backend**, each located in its respective folder.

The agent must follow these rules:

1. **Context Identification**

   * If the user's request is related to **frontend** (UI, components, styling, React, Vue, Angular, etc.), it should be treated as a frontend task.
   * If the request is related to **backend** (APIs, databases, business logic, endpoints, authentication, etc.), it should be treated as a backend task.

2. **Skills and Rules Lookup**

   * For **frontend** tasks:

     * Search exclusively within the `frontend` folder.
     * Look for any defined **skills** and **rules** files within that directory.
   * For **backend** tasks:

     * Search exclusively within the `backend` folder.
     * Look for any defined **skills** and **rules** files within that directory.

3. **Context Isolation**

   * Do not mix rules or skills between frontend and backend.
   * Each request must be resolved using only the context of the relevant project.

4. **Priority**

   * Always prioritize **rules** and **skills** found in the corresponding folder over any general knowledge.

In summary: the agent must determine whether a task is frontend or backend and restrict its search and execution to the corresponding folder within the monorepo.

ALSO READ THE 