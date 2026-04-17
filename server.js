// server.js
import express from "express";
import sqlite3 from "sqlite3";
import cors from "cors";

const app = express();
const PORT = 3000;
const email ="sara.rossi@gmail.com";

app.use(cors());
app.use(express.json({ limit: '10mb' })); 

const db = new sqlite3.Database("./nutrigenie.sqlite", (err) => {
  if (err) {
    console.error("Error opening database", err);
  } else {
    console.log("Database connected");
  }
});

app.get("/api/preferences", (req, res) => {
  const sql = 'SELECT * FROM "all_prefs"'; 
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("Errore SQL su ALLPREF:", err.message);
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

app.get("/api/user/:email/allergies", (req, res) => {
  const email = req.params.email;
  const sql = `
    SELECT id_all 
    FROM user_allergens
    WHERE email = ?
  `;
  db.all(sql, [email], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    } else {
      res.json(rows.map(r => r.id_all)); // 
    }
  });
});

app.get("/api/user/:email/allergies/names", (req, res) => {
  const email = req.params.email;
  const sql = `
    SELECT a.name 
    FROM "all_prefs" a
    JOIN user_allergens ua ON a.id = ua.id_all
    WHERE ua.email = ?
  `;

  db.all(sql, [email], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      const names = rows.map(row => row.name);
      res.json(names);
    }
  });
});

app.get("/api/meal/:id/recipe", (req, res) => {
  const mealId = req.params.id;
  const mealSql = 'SELECT * FROM Meals WHERE id = ?';
  const ingredientsSql = 'SELECT name, grams FROM Ingredients WHERE meal_id = ?';
  const stepsSql = 'SELECT step_number, step_title, step_details FROM Recipes WHERE meal_id = ? ORDER BY step_number ASC';



  db.get(mealSql, [mealId], (err, meal) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!meal) return res.status(404).json({ error: "Meal not found" });

    db.all(ingredientsSql, [mealId], (err, ingredients) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all(stepsSql, [mealId], (err, steps) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({
          info: meal,
          ingredients: ingredients,
          steps: steps
        });
      });
    });
  });
});


app.get("/api/user/:email", (req, res) => {
  const email = req.params.email;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    } else if (!row) {
      res.status(404).json({ error: "User not found" });
    } else {
      res.json(row);
    }
  });
});

app.get("/api/meals/:id/allergens/names", (req, res) => {
  const mealId = Number(req.params.id);

  if (!mealId) return res.status(400).json({ error: "Invalid meal id" });

  const sql = `
    SELECT ap.id, ap.name
    FROM Meals_Allergens ma
    JOIN "all_prefs" ap ON ap.id = ma.pref_id
    WHERE ma.meal_id = ?
    ORDER BY ap.name ASC
  `;

  db.all(sql, [mealId], (err, rows) => {
    if (err) {
      console.error("Meal allergens names error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    return res.json(rows); 
  });
});

app.post("/api/user/update", (req, res) => {
  const {
    name,
    surname,
    email,
    birth,
    phone,
    gender,
    profilePic,
    address, 
    selectedAllergyIds,
  } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const sqlUser = `
      UPDATE users
      SET name=?, surname=?, birth=?, phone=?, gender=?, profilePic=?, address=?
      WHERE email=?
    `;

    db.run(
      sqlUser,
      [name, surname, birth, phone, gender, profilePic, address, email],
      function (err) {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: "User update error" });
        }

        db.run("DELETE FROM user_allergens WHERE email = ?", [email], (err) => {
          if (err) {
            db.run("ROLLBACK");
            return res.status(500).json({ error: "Reset allergies error" });
          }

          const insertAllergens = (cb) => {
            if (!selectedAllergyIds || selectedAllergyIds.length === 0)
              return cb();

            const stmt = db.prepare(
              "INSERT INTO user_allergens (email, id_all) VALUES (?, ?)",
            );

            for (const id of selectedAllergyIds) {
              stmt.run(email, id);
            }

            stmt.finalize((err) => cb(err));
          };

          insertAllergens((err) => {
            if (err) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: "Insert allergies error" });
            }
            db.run("COMMIT", (err) => {
              if (err)
                return res.status(500).json({ error: "Transaction failed" });
              db.get(
                "SELECT * FROM users WHERE email = ?",
                [email],
                (err, user) => {
                  if (err || !user)
                    return res.json({ message: "Updated successfully" });
                  return res.json(user);
                },
              );
            });
          });
        });
      },
    );
  });
});


app.get("/api/meals/:id", (req, res) => {
  const id = req.params.id;

  db.get("SELECT * FROM Meals WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Database error" });
    } else if (!row) {
      res.status(404).json({ error: "Meal not found" });
    } else {
      res.json(row);
    }
  });
});

app.get("/api/history", (req, res) => {
  const sql = `
    SELECT
      d.day_date AS day_date,
      i.id,
      i.dish_name_en,
      i.image_url,
      i.kcal,
      i.carbs_g,
      i.protein_g,
      i.fat_g,
      i.created_at,
      typeMeal
    FROM history_day d
    JOIN history_item i ON i.day_id = d.id
    ORDER BY d.day_date DESC, i.created_at DESC, i.id DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    const grouped = [];
    const map = new Map();

    for (const r of rows) {
      if (!map.has(r.day_date)) {
        const section = { date: r.day_date, items: [] };
        map.set(r.day_date, section);
        grouped.push(section);
      }

      map.get(r.day_date).items.push({
        id: r.id,
        dish_name_en: r.dish_name_en,
        image_url: r.image_url,
        kcal: r.kcal,
        carbs_g: r.carbs_g,
        protein_g: r.protein_g,
        fat_g: r.fat_g,
        created_at: r.created_at,
        typeMeal: r.typeMeal,
      });
    }

    res.json(grouped);
  });
});

app.get("/api/getCalories", (req, res) => {
  db.get(
    `
    SELECT
      total_calories,
      total_protein,
      total_carbs,
      total_fats
    FROM user_needs
    WHERE email = ?
    `,
    [email],
    (err, needs) => {
      if (err) {
        console.error("needs query error:", err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (!needs) {
        return res.status(404).json({ error: "User needs not set" });
      }

      db.get(
        `
        SELECT
          eaten_calories,
          eaten_protein,
          eaten_carbs,
          eaten_fats
        FROM user_intake
        WHERE email = ?
          AND day = DATE('now')
        `,
        [email],
        (err2, intake) => {
          if (err2) {
            console.error("intake query error:", err2);
            return res.status(500).json({ error: "Internal server error" });
          }

          const eaten = intake ?? {
            eaten_calories: 0,
            eaten_protein: 0,
            eaten_carbs: 0,
            eaten_fats: 0,
          };

          const totalCalories = Number(needs.total_calories) || 0;
          const proteinTotal = Number(needs.total_protein) || 0;
          const carbsTotal = Number(needs.total_carbs) || 0;
          const fatsTotal = Number(needs.total_fats) || 0;

          const eatenCalories = Number(eaten.eaten_calories) || 0;
          const eatenProtein = Number(eaten.eaten_protein) || 0;
          const eatenCarbs = Number(eaten.eaten_carbs) || 0;
          const eatenFats = Number(eaten.eaten_fats) || 0;

          const response = {
            caloriesLeft: totalCalories - eatenCalories,
            totalCalories,

            proteinLeft: proteinTotal - eatenProtein,
            proteinTotal,

            carbsLeft: carbsTotal - eatenCarbs,
            carbsTotal,

            fatsLeft: fatsTotal - eatenFats,
            fatsTotal,
          };

          return res.json(response);
        }
      );
    }
  );
});

app.get("/api/meals", (req, res) => {
  const sql = `
    SELECT 
      m.*, 
      GROUP_CONCAT(ma.pref_id) as pref_ids
    FROM Meals m
    LEFT JOIN Meals_Allergens ma ON m.id = ma.meal_id
    GROUP BY m.id
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    // trasformo in array
    const mealsReady = rows.map(meal => ({
      ...meal,
      pref_ids: meal.pref_ids ? meal.pref_ids.split(',').map(Number) : []
    }));
    res.json(mealsReady);
  });
});

app.post("/api/user/allergens/update", (req, res) => {
  const { email, selectedAllergyIds } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Missing email" });
  }

  if (!Array.isArray(selectedAllergyIds)) {
    return res
      .status(400)
      .json({ error: "selectedAllergyIds must be an array" });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    db.run("DELETE FROM user_allergens WHERE email = ?", [email], (err) => {
      if (err) {
        console.error("Delete allergens error:", err);
        db.run("ROLLBACK");
        return res.status(500).json({ error: "Database error" });
      }
      if (selectedAllergyIds.length > 0) {
        const stmt = db.prepare(
          "INSERT INTO user_allergens (email, id_all) VALUES (?, ?)"
        );

        for (const id of selectedAllergyIds) {
          stmt.run(email, id);
        }

        stmt.finalize((err2) => {
          if (err2) {
            console.error("Insert allergens error:", err2);
            db.run("ROLLBACK");
            return res.status(500).json({ error: "Database error" });
          }

          db.run("COMMIT");
          return res.json({ message: "Allergens updated successfully" });
        });
      } else {
        db.run("COMMIT");
        return res.json({ message: "Allergens cleared successfully" });
      }
    });
  });
});

app.post("/api/meal/:mealId/complete", (req, res) => {
  const mealId = req.params.mealId;  
  const { typeMeal, email: bodyEmail } = req.body || {};
  const userEmail = bodyEmail || email;   
  const today = new Date().toISOString().split("T")[0];

  if (!mealId) {
    return res.status(400).json({ error: "Missing mealId" });
  }

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    db.run(
      "INSERT OR IGNORE INTO history_day (day_date) VALUES (?)",
      [today],
      function (err) {
        if (err) {
          console.error("Errore history_day:", err);
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Errore history_day" });
        }

        db.get(
          "SELECT id FROM history_day WHERE day_date = ?",
          [today],
          (err, dayRow) => {
            if (err || !dayRow) {
              console.error("Errore select history_day:", err);
              db.run("ROLLBACK");
              return res.status(500).json({ error: "Errore history_day select" });
            }

            const dayId = dayRow.id;

            db.get(
              "SELECT * FROM Meals WHERE id = ?",
              [mealId],
              (err, meal) => {
                if (err || !meal) {
                  console.error("Errore select meal:", err);
                  db.run("ROLLBACK");
                  return res.status(500).json({ error: "Meal not found" });
                }

                const sqlItem = `
                  INSERT INTO history_item
                    (day_id, dish_name_en, image_url, kcal, carbs_g, protein_g, fat_g, typeMeal)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;

                db.run(
                  sqlItem,
                  [
                    dayId,
                    meal.name,
                    meal.foto,
                    meal.calorie,
                    meal.carbo,
                    meal.proteins,
                    meal.fat,
                    typeMeal || "Lunch",
                  ],
                  function (err) {
                    if (err) {
                      console.error("Errore history_item:", err);
                      db.run("ROLLBACK");
                      return res.status(500).json({ error: "Errore history_item" });
                    }

                    const sqlIntake = `
                      INSERT INTO user_intake (email, day, eaten_calories, eaten_protein, eaten_carbs, eaten_fats)
                      VALUES (?, ?, ?, ?, ?, ?)
                      ON CONFLICT(email, day) DO UPDATE SET
                        eaten_calories = eaten_calories + excluded.eaten_calories,
                        eaten_protein = eaten_protein + excluded.eaten_protein,
                        eaten_carbs = eaten_carbs + excluded.eaten_carbs,
                        eaten_fats = eaten_fats + excluded.eaten_fats
                    `;

                    db.run(
                      sqlIntake,
                      [
                        userEmail,
                        today,
                        meal.calorie,
                        meal.proteins,
                        meal.carbo,
                        meal.fat,
                      ],
                      function (err) {
                        if (err) {
                          console.error("Errore user_intake:", err);
                          db.run("ROLLBACK");
                          return res.status(500).json({ error: "Errore user_intake" });
                        }

                        db.run("COMMIT", (err) => {
                          if (err) {
                            console.error("Errore finale commit:", err);
                            return res.status(500).json({ error: "Errore finale commit" });
                          }

                          return res.json({
                            message: "Meal completed and successfully recorded!",
                          });
                        });
                      }
                    );
                    db.run(
                      `INSERT INTO meal_completion (meal_id, day, completed)
                      VALUES (?, ?, 1)
                      ON CONFLICT(meal_id, day) DO UPDATE SET completed = 1`,
                      [mealId, today],
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

app.get("/api/meal/:mealId/completed", (req, res) => {
  const mealId = req.params.mealId;
  const today = new Date().toISOString().split("T")[0];

  db.get(
    "SELECT completed FROM meal_completion WHERE meal_id = ? AND day = ?",
    [mealId, today],
    (err, row) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json({ completed: row?.completed === 1 });
    },
  );
});

app.get("/api/restaurant/:restaurantName", (req, res) => {
  const restaurantName = req.params.restaurantName;

  const sql = `
    SELECT id, name, address, city, latitude, longitude, price_range
    FROM restaurant
    WHERE name = ? COLLATE NOCASE
  `;

  db.all(sql, [restaurantName], (err, rows) => {
    if (err) {
      console.error("Error fetching restaurants:", err);
      return res.status(500).json({ error: "Database error" });
    }
    return res.json(rows);
  });
});




app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});