const errorCodes = require("../../constants/error-codes");
const pool = require("../../db");


const listTasks = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.name, t.description, c.id AS category_id, c.name AS category_name
       FROM tasks t
       JOIN task_categories c ON c.id = t.category_id
       ORDER BY t.name`,
    );

    return res.status(200).json({
      ok: true,
      data: rows,
    });
  } catch (error) {
    console.error("listTasks failed:", error);
    return res.status(500).json({
      ok: false,
      error: {
        code: errorCodes.INTERNAL_ERROR,
        message: "Something went wrong. Please try again.",
      },
    });
  }
};


const getUserTasks = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT t.id, t.name, t.description, c.id AS category_id, c.name AS category_name
       FROM user_tasks ut
       JOIN tasks t ON t.id = ut.task_id
       JOIN task_categories c ON c.id = t.category_id
       WHERE ut.user_id = $1
       ORDER BY t.name`,
      [req.userId],
    );
    return res.status(200).json({ count: rows.length, data: rows });
  } catch (error) {
    console.error("getMyTasks failed:", error);
    return res.status(500).json({
      ok: false,
      error: {
        code: errorCodes.INTERNAL_ERROR,
        message: "Something went wrong. Please try again.",
      },
    });
  }
};

module.exports = {
  listTasks,
  getUserTasks 
};
