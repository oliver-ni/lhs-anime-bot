module.exports = (client, member) => {
    if (member.id == "485641940826849292") {
        const role = member.guild.roles.get("628467063496638474")
        member.roles.add(role);
    }
};
