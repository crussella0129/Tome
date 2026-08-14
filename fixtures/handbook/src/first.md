# First Chapter

The first numbered chapter of the external handbook. It has a nested section to
exercise nested-path resolution.

```txt
TOME_BOOK=/path/to/book npm run build
```

This chapter references a **relative image** from the external book — proof that
chapter-relative assets resolve and are optimized:

![A sacred plate](./img/plate.svg)

The book also keeps shared artwork beside its declared `src/` directory. This
genuine parent-relative reference proves Tome prepares only the named asset:

![A parent-held plate](../assets/parent-plate.svg)
