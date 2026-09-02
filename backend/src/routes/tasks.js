const createCrudRouter = require('./factory/crudRouter');
const Task = require('../models/Task');

module.exports = createCrudRouter({
  model: Task,
  label: 'Tarea'
});
