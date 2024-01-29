const express = require("express");
const app = express();
app.use(express.json());
const dateFns = require("date-fns");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDBandServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000);
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBandServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityAndCategoryProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
};

const convertIntoObj = (object) => {
  return {
    id: object.id,
    todo: object.todo,
    priority: object.priority,
    status: object.status,
    category: object.category,
    dueDate: object.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;
  let c = 0;

  if (status === undefined) {
    c = c + 1;
  } else if (
    status !== undefined &&
    status !== "TO DO" &&
    status !== "IN PROGRESS" &&
    status !== "DONE"
  ) {
    response.status(400);
    response.send("Invalid Todo Status");
  } else {
    c = c + 1;
  }

  if (priority === undefined) {
    c = c + 1;
  } else if (
    priority !== undefined &&
    priority !== "HIGH" &&
    priority !== "MEDIUM" &&
    priority !== "LOW"
  ) {
    response.status(400);
    response.send("Invalid Todo Priority");
  } else {
    c = c + 1;
  }

  if (category === undefined) {
    c = c + 1;
  } else if (
    category !== undefined &&
    category !== "WORK" &&
    category !== "HOME" &&
    category !== "LEARNING"
  ) {
    response.status(400);
    response.send("Invalid Todo Category");
  } else {
    c = c + 1;
  }

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND category = '${category}';`;
      break;
    case hasPriorityAndCategoryProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}'
        AND category = '${category}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await db.all(getTodosQuery);
  response.send(data.map((object) => convertIntoObj(object)));
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `SELECT * FROM todo WHERE id = ${todoId};`;
  const data = await db.get(query);
  response.send(convertIntoObj(data));
});

app.get("/agenda/", async (request, response) => {
  let { date } = request.query;
  const query = `SELECT * FROM todo WHERE due_date = '${date}';`;
  const data = await db.all(query);
  response.send(data.map((object) => convertIntoObj(object)));
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const postTodoQuery = `
  INSERT INTO
    todo (id, todo, priority, status,category,due_date)
  VALUES
    (${id}, '${todo}', '${priority}', '${status}','${category}','${dueDate}');`;
  await db.run(postTodoQuery);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category = '${category}',
      due_date = '${dueDate}'
    WHERE
      id = ${todoId};`;

  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
