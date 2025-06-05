const mongoose = require('mongoose');

const ChapterSchema = new mongoose.Schema({
    subject: String,
    chapter: String,
    class: String,
    unit: String,
    yearWiseQuestionCount: Object,
    questionSolved: Number,
    status: String,
    isWeakChapter: Boolean
  }, { timestamps: true });

  const Chapter = mongoose.model('Chapter', ChapterSchema);

  module.exports = Chapter;