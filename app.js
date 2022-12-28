const Discord = require('discord.js');
const { PermissionsBitField, Constants, Routes, ModalBuilder, TextInputBuilder, ApplicationCommandOptionType, ActivityType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, TextInputStyle } = require('discord.js');
const { REST } = require("@discordjs/rest");
const fs = require('fs');
require("dotenv").config();
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const { min } = require('lodash');
const client = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.GuildVoiceStates,
    Discord.GatewayIntentBits.MessageContent
  ]
})

var objects = []

const commands = [
    {
      name: "start",
      description: "Begins the starting for registering scrims",
      defaultMemberPermissions: 0,
    },
    {
      name: "setup",
      description: "Sets up the bot for this specific server",
    },
    {
      name: "manage",
      description: "Presents options that allow for the management of the ladder"
    }
]

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Started refreshing application [/] commands.");

    await rest.put(Routes.applicationCommands("1055784946003873793"), { body: commands });

    console.log("Successfully reloaded application [/] commands.");
  } catch(error) {
    console.error(error);
  }
})();


client.on('ready', () => {
    console.log(`${client.user.tag} is ready`)
})

client.on("interactionCreate", async (interaction) => {

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "start") {
          if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {

            var amount = 0;
            let file
            const directory = fs.opendirSync('./data/' + interaction.guildId)

            while ((file = directory.readSync()) !== null) {
              amount = amount + 1;
            }

            if (amount > 0) {
              const modal = new ModalBuilder()
              .setCustomId("fields")
              .setTitle("Fields");
            
              const teamInput = new TextInputBuilder()
                .setCustomId("amountOfTeams")
                .setLabel("Enter the amount of teams that can register")
                .setStyle(TextInputStyle.Short)

              const timeInput = new TextInputBuilder()
                .setCustomId("timeSignup")
                .setLabel("Enter the time registration opens (in milis)")
                .setStyle(TextInputStyle.Short)

              const timeStart = new TextInputBuilder()
                .setCustomId("timeStart")
                .setLabel("Enter the time the event starts (in milis)")
                .setStyle(TextInputStyle.Short)

              const leaderboard = new TextInputBuilder()
              .setCustomId("leaderboard")
              .setLabel("Enter the leaderboard URL")
              .setStyle(TextInputStyle.Short)

              const signupRole = new TextInputBuilder()
              .setCustomId("signupRole")
              .setLabel("Enter ID of role given after signing up")
              .setStyle(TextInputStyle.Short)

              const firstActionRow = new ActionRowBuilder().addComponents(teamInput);
              const secondActionRow = new ActionRowBuilder().addComponents(timeInput);
              const thirdActionRow = new ActionRowBuilder().addComponents(timeStart);
              const fourthActionRow = new ActionRowBuilder().addComponents(leaderboard);
              const fifthActionRow = new ActionRowBuilder().addComponents(signupRole);

              modal.addComponents(firstActionRow, secondActionRow, thirdActionRow, fourthActionRow, fifthActionRow);

              await interaction.showModal(modal);
            } else {
              interaction.reply({
                content: "You cannot start scrims as there is no roles added.",
                ephemeral: true,
              })
            }
          } else {
            interaction.reply({
              content: "You do not have permission to execute this command",
              ephemeral: true
            });
          }
      } else if (interaction.commandName === "setup") {
        if (interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {

          if (!fs.existsSync("./data/" + interaction.guildId)) {
            fs.mkdirSync("./data/" + interaction.guildId)
            const embed = new EmbedBuilder()
              .setTitle("Server Setup")
              .setDescription("Use the buttons below to setup the server")
              .setColor("#249ee0")
              .setTimestamp()

            const addRole = new ButtonBuilder()
              .setCustomId("addRole")
              .setLabel("Add Role")
              .setStyle(ButtonStyle.Primary)

            const removeRole = new ButtonBuilder()
              .setCustomId("removeRole")
              .setLabel("Remove Role")
              .setStyle(ButtonStyle.Primary)

            const staffRole = new ButtonBuilder()
              .setCustomId("setStaffRole")
              .setLabel("Set Staff Role")
              .setStyle(ButtonStyle.Primary)

            const notis = new ButtonBuilder()
              .setCustomId("setNotiChannel")
              .setLabel("Set Notifications Channel")
              .setStyle(ButtonStyle.Success)

            const finish = new ButtonBuilder()
              .setCustomId("finishSetup")
              .setLabel("Finish Setup")
              .setStyle(ButtonStyle.Danger)

            

            const actionRow = new ActionRowBuilder().setComponents(addRole, removeRole, notis, staffRole, finish);

            interaction.reply({
              embeds: [embed],
              ephemeral: true,
              components: [actionRow]
            })
          } else {
            interaction.reply({
              content: "This server has already been setup. It can be modified with the settings command",
              ephemeral: true
            });
          }
        

          
        } else {
          interaction.reply({
            content: "You do not have permission to execute this command",
            ephemeral: true
          });
        }
      } else if (interaction.commandName === "manage") {
        if (fs.existsSync('./staff/' + interaction.guildId + '.json')) {
          try {
            var roleID = fs.readFileSync('./staff/' + interaction.guildId + '.json', 'utf8');
            var role = interaction.guild.roles.cache.get(roleID)
            if (typeof role === "undefined") {
              interaction.reply({
                content: "This specified staff role does not exist.",
                ephemeral: true,
              })
            } else {
              if (interaction.member.roles.cache.has(role.id)) {
                const embed = new EmbedBuilder()
                  .setTitle("Staff Management Menu")
                  .setDescription("Use the buttons below to manage your options")
                  .setTimestamp()

                const removePlayer = new ButtonBuilder()
                  .setCustomId("removePlayer")
                  .setLabel("Remove Player")
                  .setStyle(ButtonStyle.Danger)

                const cancelLadder = new ButtonBuilder()
                  .setCustomId("cancelLadder")
                  .setLabel("Cancel Ladder")
                  .setStyle(ButtonStyle.Danger)
        
                const viewSignedUp = new ButtonBuilder()
                  .setCustomId("viewSignedUp")
                  .setLabel("View Signed Up")
                  .setStyle(ButtonStyle.Primary)

                const actionRow = new ActionRowBuilder().setComponents(removePlayer, cancelLadder, viewSignedUp);

                interaction.reply({embeds: [embed], components: [actionRow], ephemeral: true})

                
              } else {
                interaction.reply({
                  content: "You cannot execute this command.",
                  ephemeral: true,
                })
              }
            }
          } catch (err) {
            console.log(err)
          }
        } else {
          interaction.reply({
            content: "This command cannot be executed without a staff role being defined",
            ephemeral: true,
          })
        }
      }
     } else if (interaction.isModalSubmit()) {
      if (interaction.customId === "fields") {
        const players = interaction.fields.getTextInputValue('amountOfTeams');
        const timeSignup = interaction.fields.getTextInputValue('timeSignup');
        const timeStart = interaction.fields.getTextInputValue('timeStart');
        const leaderboardURL = interaction.fields.getTextInputValue("leaderboard");
        const signupRole = interaction.fields.getTextInputValue("signupRole");

        

        var uuid = uuidv4()

        fs.mkdirSync("./ladders/" + uuid)
        

        var gamemode
        if (players === "100") {
          gamemode = "Solos"
        } else if (players < 100 && players >= 50) {
          gamemode = "Duos"
        } else if (players < 50 && players >= 33) {
          gamemode = "Trios"
        } else if (players < 33 && players >= 25) {
          gamemode = "Squads"
        } else {
          gamemode = "Unknown Gamemode"
        }

        var array = []
          
          const directory = fs.opendirSync('./data/' + interaction.guildId)
            let file
            while ((file = directory.readSync()) !== null) {
              var name = file.name.replace(".json", "")
              var object = {}
              object["name"] = name;
              object["delay"] = fs.readFileSync("./data/" + interaction.guildId + "/" + file.name, 'utf8');
              array.push(object)
            }

            array.sort((a,b) => {
              return a.delay - b.delay;
            })

        var value = "";

        for (var object of array) {
          var date = new Date()
          date.setTime(timeSignup)
          date = moment(date).add(Number(object.delay), 'ms').toDate();
          value = value + "<@&" + object.name + ">: <t:" + date.getTime() + "> (<t:" + date.getTime() + ":R>) \n"
        }

        

        const embed = new EmbedBuilder()
          .setTitle(gamemode + " Ladder")
          .setDescription("Signups will occur <t:" + timeSignup + ":R> \n \n**Signups will open at the following times:**\n" + value)
          .setTimestamp()
          .setFooter({
            text: 'Ladder ID: ' + uuid
          })
          .addFields(
            { name: "Max Teams", value: "0/" + players, inline: true },
            { name: "Ladder Start Time", value: "<t:" + timeStart + ":R>", inline: true},
          )

          const register = new ButtonBuilder()
          .setCustomId("register")
          .setLabel("Register")
          .setStyle(ButtonStyle.Primary)

        const map = new ButtonBuilder()
          .setLabel("Map")
          .setURL("https://google.com") // to do
          .setStyle(ButtonStyle.Link)

        const leaderboard = new ButtonBuilder()
          .setLabel("Leaderboard")
          .setURL(leaderboardURL) 
          .setStyle(ButtonStyle.Link)


        if (fs.existsSync('./notifications/' + interaction.guildId + '.json')) {
          try {
            var channelID = fs.readFileSync('./notifications/' + interaction.guildId + '.json', 'utf8');
            var channel = interaction.guild.channels.cache.get(channelID)

            const embed = new EmbedBuilder()
              .setTitle("Notification")
              .setColor("#209629")
              .setDescription("<@" + interaction.member.id + "> created a new ladder.")
              .addFields(
                { name: "Maximum Teams", value: players, inline: true },
                { name: "Time Signups Open", value: "<t:" + timeStart + ":R>", inline: true },
                { name: "Ladder Start Time", value: "<t:" + timeStart + ":R>", inline: true},
                { name: "UUID of Ladder", value: uuid, inline: true },
                { name: "Gamemode of Ladder", value: gamemode, inline: true },
                { name: "Ladder Role", value: "<@&" + signupRole + ">", inline: true }
              )
              .setTimestamp()
            
            channel.send({embeds: [embed]})
          } catch (err) {
            console.error(err)
          }
        }

        const actionRow = new ActionRowBuilder().setComponents(register, map, leaderboard);

        //interaction.reply({
          //content: "Your ladder has been created",
          //ephemeral: true,
        //}) keeping out for now until testing is done


        

        client.channels.cache.get(interaction.channelId).send({embeds: [embed], components: [actionRow]}).then((msg) => {
          const obj = {
            serverID: interaction.guildId,
            players: players,
            timeSignup: timeSignup,
            timeStart: timeStart,
            gamemode: gamemode,
            signupRole: signupRole,
            uuid: uuid,
            signedUpPlayers: 0,
            message: msg,
          }

          objects.push(obj)
        })
      } else if (interaction.customId === "notiConfig") {
        const channelID = interaction.fields.getTextInputValue('channelID');

        if (interaction.guild.channels.cache.get(channelID) === "undefined") {
          interaction.reply({
            content: "The specified channel does not exist.",
            ephemeral: true
          })
        } else {
          fs.writeFile("./notifications/" + interaction.guildId + ".json", channelID, (err) => {
            if (err) {
              console.log("An error occured and this action was not completed")
            }
          })
          interaction.reply({
            content: "You have set the channel to receive notifications to be " + channelID + ".",
            ephemeral: true
          })
        }
      
      } else if (interaction.customId === "viewSignedUp") {
        const uuid = interaction.fields.getTextInputValue('uuid');

        var exists = false;
        var signUpRole

        for (var objec of objects) {
          if (objec.serverID === interaction.guildId && objec.uuid === uuid) {
            exists = true;
            signUpRole = objec.signupRole
          }
        }

        if (exists) {
          const role = interaction.guild.roles.cache.get(signUpRole)

          var members = ""

          if (role.members.size != 0) {
            
            role.members.forEach((value) => {
              members = members + "<@" + value.id + "> \n"
            })

            interaction.reply({
              content: "People who have signed up: \n\n" + members,
              ephemeral: true
            })
          } else {
            interaction.reply({
              content: "Nobody has signed up for this ladder yet. 😦",
              ephemeral: true
            })
          }
        } else {
          interaction.reply({
            content: 'The specified ladder does not exist',
            ephemeral: true
          })
        }

      } else if (interaction.customId === "cancelLadder") {
        const uuid = interaction.fields.getTextInputValue('uuid');

        var exists = false;
        var roleID
        var objectOfRole
        var index
        for (let obj of objects) {
          if (obj.serverID === interaction.guildId && obj.uuid === uuid) {
            exists = true;
            roleID = obj.signupRole
            objectOfRole = obj
            index = objects.indexOf(obj)
          }
        }
        if (exists) {
          if (fs.existsSync('./notifications/' + interaction.guildId + '.json')) {
            try {
              var channelID = fs.readFileSync('./notifications/' + interaction.guildId + '.json', 'utf8');
              var channel = interaction.guild.channels.cache.get(channelID)
  
              const embed = new EmbedBuilder()
                .setTitle("Notification")
                .setColor("#bf2d1d")
                .setDescription("<@" + interaction.member.id + "> cancelled a ladder.")
                .addFields(
                  { name: "Signed Up Teams", value: objectOfRole.signedUpPlayers, inline: true },
                  { name: "Time Signups Opened", value: "<t:" + objectOfRole.timeStart + ":R>", inline: true },
                  { name: "Time Ladder Started", value: "<t:" + objectOfRole.timeStart + ":R>", inline: true},
                  { name: "UUID of Ladder", value: uuid, inline: true },
                  { name: "Gamemode of Ladder", value: objectOfRole.gamemode, inline: true },
                  { name: "Ladder Role", value: "<@&" + objectOfRole.signupRole + ">", inline: true }
                )
                .setTimestamp()
              
              channel.send({embeds: [embed]})
            } catch (err) {
              console.error(err)
            }
          }

           objectOfRole.message.delete()

           role.members.forEach((value) => {
            const user = interaction.guild.members.cache.get(value.id);
            user.send("The ladder that you signed up for, with the UUID of " + objectOfRole.uuid + ", has been cancelled.")
          })

          role.delete("Ladder was cancelled.") 
          objects.splice(index, 1)

          interaction.reply({
            content: "The ladder you specified has been cancelled",
            ephemeral: true
          })

        } else {
          interaction.reply({
            content: "The specified ladder does not exist",
            ephemeral: true
          })
        }
      } else if (interaction.customId === "roleConfig") {
        const roleID = interaction.fields.getTextInputValue('roleID');
        const timeDelay = interaction.fields.getTextInputValue("delay");

        let role = interaction.guild.roles.cache.get(roleID)
        if (typeof role === "undefined") {
          interaction.reply({
            content: "The specified role does not exist",
            ephemeral: true
          })
          return;
        }

        fs.writeFile("./data/" + interaction.guildId + "/" + roleID + ".json", timeDelay, (err) => {
          if (err) {
            console.log("An error occured and this action was not completed")
          }
        })

        interaction.reply({
          content: "The specified role has been added",
          ephemeral: true
        })

        if (fs.existsSync('./notifications/' + interaction.guildId + '.json')) {
          try {
            var channelID = fs.readFileSync('./notifications/' + interaction.guildId + '.json', 'utf8');
            var channel = interaction.guild.channels.cache.get(channelID)

            const embed = new EmbedBuilder()
              .setTitle("Notification")
              .setColor("#209629")
              .setDescription("<@" + interaction.member.id + "> added a role.")
              .addFields(
                { name: "Role", value: "<@&" + roleID + ">", inline: true },
                { name: "Delay for Signups", value: timeDelay, inline: true }
              )
              .setTimestamp()
            
            channel.send({embeds: [embed]})
          } catch (err) {
            console.error(err)
          }
        }

      } else if (interaction.customId === "removePlayer") {
        const uuid = interaction.fields.getTextInputValue('uuid');
        const player = interaction.fields.getTextInputValue('player');

        var exists = false;
        var objectOfRole
        var index
        for (let obj of objects) {
          if (obj.serverID === interaction.guildId && obj.uuid === uuid) {
            exists = true;
            objectOfRole = obj
            index = objects.indexOf(obj)
          }
        }

        if (exists) {
          const user = interaction.guild.members.cache.get(player);
          if (typeof user === "undefined") {
            interaction.reply({
              content: "The specified user does not exist",
              ephemeral: true
            })
          } else {
            if (user.roles.cache.has(objectOfRole.signupRole)) {
              user.roles.remove(objectOfRole.signupRole)
              var signedUp = objectOfRole.signedUpPlayers
              signedUp = Number(signedUp) - 1;
              objectOfRole.signedUpPlayers = signedUp
              objects[index] = objectOfRole
              interaction.reply({
                content: "You have removed <@" + user + "> from the ladder with the UUID of " + uuid + ".",
                ephemeral: true,
              })
              if (fs.existsSync('./notifications/' + interaction.guildId + '.json')) {
                try {
                  var channelID = fs.readFileSync('./notifications/' + interaction.guildId + '.json', 'utf8');
                  var channel = interaction.guild.channels.cache.get(channelID)
      
                  const embed = new EmbedBuilder()
                    .setTitle("Notification")
                    .setColor("#bf2d1d")
                    .setDescription("<@" + interaction.member.id + "> removed a player from a ladder.")
                    .addFields(
                      { name: "UUID of Ladder", value: uuid, inline: true },
                      { name: "Player", value: "<@" + player + ">", inline: true }
                    )
                    .setTimestamp()
                  
                  channel.send({embeds: [embed]})
                } catch (err) {
                  console.error(err)
                }
              }
              var signedUpAmount = objectOfRole.message.embeds[0].data.fields[0].value.split("/")
              var signedUpPlayers = signedUpAmount[0]

              signedUpPlayers = Number(signedUpPlayers) - 1;

              const embed = new EmbedBuilder()
                .setTitle(objectOfRole.message.embeds[0].data.title)
                .setDescription(objectOfRole.message.embeds[0].data.description)
                .setFooter({
                  text: objectOfRole.message.embeds[0].data.footer.text
                })
                .addFields(
                  { name: objectOfRole.message.embeds[0].data.fields[0].name, value: signedUpPlayers + "/" + signedUpAmount[1], inline: objectOfRole.message.embeds[0].data.fields[0].inline},
                  { name: objectOfRole.message.embeds[0].data.fields[1].name, value: objectOfRole.message.embeds[0].data.fields[1].value, inline: objectOfRole.message.embeds[0].data.fields[1].inline}
                )



              objectOfRole.message.edit({
                embeds: [embed]
              })


              objectOfRole.signedUpPlayers = signedUpPlayers;

              objects[index] = objectOfRole;
              user.send("You have been removed from the ladder with the UUID of " + uuid)
            } else {
              interaction.reply({
                content: "The specified user is not signed up for this ladder.",
                ephemeral: true,
              })
            }
          }
        } else {
          interaction.reply({
            content: "The specified varibles do not exist in the database",
            ephemeral: true
          })
        }

      } else if (interaction.customId === "removeRole") {
        const roleID = interaction.fields.getTextInputValue('roleID');

        const directory = fs.opendirSync('./data/' + interaction.guildId)
        let file
        var exists = false;
        while ((file = directory.readSync()) !== null) {
          var name = file.name.replace(".json", "")
          if (name === roleID) {
            exists = true;
          }
        }
        if (exists) {
          fs.unlink('./data/' + interaction.guildId + "/" + roleID + ".json",function(err){
            if(err) return console.log(err);
          });  
          interaction.reply({
            content: "You have removed <@&" + roleID + "> from the database.",
            ephemeral: true,
          })
          if (fs.existsSync('./notifications/' + interaction.guildId + '.json')) {
            try {
              var channelID = fs.readFileSync('./notifications/' + interaction.guildId + '.json', 'utf8');
              var channel = interaction.guild.channels.cache.get(channelID)
  
              const embed = new EmbedBuilder()
                .setTitle("Notification")
                .setColor("#bf2d1d")
                .setDescription("<@" + interaction.member.id + "> removed a role.")
                .addFields(
                  { name: "Role", value: "<@&" + roleID + ">", inline: true }
                )
                .setTimestamp()
              
              channel.send({embeds: [embed]})
            } catch (err) {
              console.error(err)
            }
          }
        } else {
          interaction.reply({
            content: "You cannot remove this role as it doesn't exist in the database",
            ephemeral: true,
          })
          return;
        }
      } else if (interaction.customId === "staffConfig") {
        const roleID = interaction.fields.getTextInputValue('roleID');

        let role = interaction.guild.roles.cache.get(roleID)
        if (typeof role === "undefined") {
          interaction.reply({
            content: "The specified role does not exist",
            ephemeral: true
          })
          return;
        } else {
          fs.writeFile("./staff/" + interaction.guildId + ".json", roleID, (err) => {
            if (err) {
              console.log("An error occured and this action was not completed")
            }
          })
  
          interaction.reply({
            content: "You have set the staff role of this server to <@&" + roleID + ">",
            ephemeral: true
          })
          if (fs.existsSync('./notifications/' + interaction.guildId + '.json')) {
            try {
              var channelID = fs.readFileSync('./notifications/' + interaction.guildId + '.json', 'utf8');
              var channel = interaction.guild.channels.cache.get(channelID)
  
              const embed = new EmbedBuilder()
                .setTitle("Notification")
                .setColor("#209629")
                .setDescription("<@" + interaction.member.id + "> updated the staff role.")
                .addFields(
                  { name: "Staff Role", value: "<@&" + roleID + ">", inline: true }
                )
                .setTimestamp()
              
              channel.send({embeds: [embed]})
            } catch (err) {
              console.error(err)
            }
          }
          return;
        }
      }
    } else if (interaction.isButton()) {
      if (interaction.customId === "addRole") {
        const modal = new ModalBuilder()
            .setCustomId("roleConfig")
            .setTitle("Role Configuration");

        const roleInput = new TextInputBuilder()
          .setCustomId("roleID")
          .setLabel("Enter the ID of the role")
          .setStyle(TextInputStyle.Short)

        const delay = new TextInputBuilder()
          .setCustomId("delay")
          .setLabel("Enter the delay of signups (in seconds)")
          .setStyle(TextInputStyle.Short)

          const firstActionRow = new ActionRowBuilder().addComponents(roleInput);
          const secondActionRow = new ActionRowBuilder().addComponents(delay);

          modal.addComponents(firstActionRow, secondActionRow);

          await interaction.showModal(modal);
      } else if (interaction.customId === "setNotiChannel") {
        const modal = new ModalBuilder()
        .setCustomId("notiConfig")
        .setTitle("Notification Config");

        const roleInput = new TextInputBuilder()
          .setCustomId("channelID")
          .setLabel("Enter the ID of the channel")
          .setStyle(TextInputStyle.Short)

        const firstActionRow = new ActionRowBuilder().addComponents(roleInput);
        

        modal.addComponents(firstActionRow, );

          await interaction.showModal(modal);
      } else if (interaction.customId === "cancelLadder") {
        const modal = new ModalBuilder()
        .setCustomId("cancelLadder")
        .setTitle("Cancel Ladder");

      const uuid = new TextInputBuilder()
        .setCustomId("uuid")
        .setLabel("Enter the ID of the ladder")
        .setStyle(TextInputStyle.Short)

        const firstActionRow = new ActionRowBuilder().addComponents(uuid);

        modal.addComponents(firstActionRow);

        await interaction.showModal(modal)
      } else if (interaction.customId === "viewSignedUp") {
        const modal = new ModalBuilder()
          .setCustomId("viewSignedUp")
          .setTitle("View Signed Up");

        const uuid = new TextInputBuilder()
          .setCustomId("uuid")
          .setLabel("Enter the ID of the ladder")
          .setStyle(TextInputStyle.Short)

          const firstActionRow = new ActionRowBuilder().addComponents(uuid);
  
          modal.addComponents(firstActionRow);
  
          await interaction.showModal(modal)
      } else if (interaction.customId === "removePlayer") {
        const modal = new ModalBuilder()
          .setCustomId("removePlayer")
          .setTitle("Remove Player");

        const uuid = new TextInputBuilder()
          .setCustomId("uuid")
          .setLabel("Enter the ID of the ladder")
          .setStyle(TextInputStyle.Short)

        const player = new TextInputBuilder()
          .setCustomId("player")
          .setLabel("Enter the ID of the player")
          .setStyle(TextInputStyle.Short)

        const firstActionRow = new ActionRowBuilder().addComponents(uuid);
        const secondActionRow = new ActionRowBuilder().addComponents(player);

        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal)
      } else if (interaction.customId === "setStaffRole") {

        const modal = new ModalBuilder()
            .setCustomId("staffConfig")
            .setTitle("Staff Configuration");
        
        const roleInput = new TextInputBuilder()
          .setCustomId("roleID")
          .setLabel("Enter the ID of the role")
          .setStyle(TextInputStyle.Short)

        const firstActionRow = new ActionRowBuilder().addComponents(roleInput);
      
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
      
      } else if (interaction.customId === "register") {
        const directory = fs.opendirSync('./data/' + interaction.guildId)
        let file
        var array = []
        while ((file = directory.readSync()) !== null) {
          var name = file.name.replace(".json", "")
          var object = {}
          object["name"] = name;
          object["delay"] = fs.readFileSync("./data/" + interaction.guildId + "/" + file.name, 'utf8');
          array.push(object)
        }

        array.sort((a,b) => {
          return a.delay - b.delay;
        })

        var hasRole = false;
        var delay
        var signedUp
        for (var object of array) {
          const role = interaction.guild.roles.cache.get(object.name);
          
          if (interaction.member.roles.cache.has(role.id)) {
            hasRole = true;
            delay = object.delay
            signedUp = object.signedUpPlayers
          }
        }

        if (hasRole) {

          var obje
          var index
          for (const obj of objects) {
            if (obj.uuid === interaction.message.embeds[0].footer.text.replace("Ladder ID: ", "")) {
              obje = obj;
              index = objects.indexOf(obj)
            }
          }


          if (obje === undefined) {
            interaction.member.send("An error occured when processing this event. Please ask an administrator to resend the message and try again")
          }

          var signupRoleGiven = interaction.guild.roles.cache.get(obje.signupRole)

          var signupForPerson = new Date()
          signupForPerson.setTime(obje.timeSignup)
          signupForPerson = moment(signupForPerson).add(Number(delay), 'ms').toDate();


          if (Date.now() - (signupForPerson.getTime() * 1000) > 0) {
            if (interaction.member.roles.cache.has(signupRoleGiven.id)) {
              interaction.member.send("You have already signed up for this ladder")
            } else {
              interaction.member.roles.add(signupRoleGiven)

              var signedUpAmount = interaction.message.embeds[0].data.fields[0].value.split("/")
              var signedUpPlayers = signedUpAmount[0]

              if (Number(signedUpPlayers) >= Number(signedUpAmount[1])) {
                interaction.member.send("The maximum amount of teams has already signed up for this ladder")
              } else {

                signedUpPlayers = Number(signedUpPlayers) + 1;

                const embed = new EmbedBuilder()
                  .setTitle(interaction.message.embeds[0].data.title)
                  .setDescription(interaction.message.embeds[0].data.description)
                  .setFooter({
                    text: interaction.message.embeds[0].data.footer.text
                  })
                  .addFields(
                    { name: interaction.message.embeds[0].data.fields[0].name, value: signedUpPlayers + "/" + signedUpAmount[1], inline: interaction.message.embeds[0].data.fields[0].inline},
                    { name: interaction.message.embeds[0].data.fields[1].name, value: interaction.message.embeds[0].data.fields[1].value, inline: interaction.message.embeds[0].data.fields[1].inline}
                  )



                interaction.message.edit({
                  embeds: [embed]
                })


                obje.signedUpPlayers = signedUpPlayers;

                objects[index] = obje;

                interaction.member.send("You have signed up for the ladder. Go to the map to select your spot")

                if (fs.existsSync('./notifications/' + interaction.guildId + '.json')) {
                  try {
                    var channelID = fs.readFileSync('./notifications/' + interaction.guildId + '.json', 'utf8');
                    var channel = interaction.guild.channels.cache.get(channelID)
        
                    const embed = new EmbedBuilder()
                      .setTitle("Notification")
                      .setColor("#209629")
                      .setDescription("<@" + interaction.member.id + "> registered for a ladder.")
                      .addFields(
                        { name: "UUID of Ladder", value: obje.uuid, inline: true },
                        { name: "Gamemode of Ladder", value: obje.gamemode, inline: true },
                        { name: "Ladder Role", value: "<@&" + obje.signupRole + ">", inline: true }
                      )
                      .setTimestamp()
                    
                    channel.send({embeds: [embed]})
                  } catch (err) {
                    console.error(err)
                  }
                }
                
              }
            }
          } else {
            var diff2 =((signupForPerson.getTime() * 1000) - Date.now()) / 1000;
            var seconds = Math.abs(Math.round(diff2));
            if (seconds > 60) {
              var minutes = 0;
              while (seconds > 60) {
                minutes = minutes + 1;
                seconds = seconds - 60;
              }
              if (minutes > 60) {
                var hours = 0;
                while (minutes > 60) {
                  hours = hours + 1;
                  minutes = minutes - 60;
                }
                if (hours > 24) {
                  var days = 0;
                  while (hours > 24) {
                    hours = hours - 24;
                    days = days + 1;
                  }
                  
                  interaction.member.send("You are not able to sign up yet. Please wait " + days + ((days === 1) ? ' day ' : ' days ') + hours + ((hours === 1) ? ' hour ' : ' hours ') + minutes + ((minutes === 1) ? ' minute ' : ' minutes ') + "and " + seconds + ((seconds === 1) ? ' second ' : ' seconds '))
                  return;
                } else {
                  
                  interaction.member.send("You are not able to sign up yet. Please wait " + hours + ((hours === 1) ? ' hour ' : ' hours ') + minutes + ((minutes === 1) ? ' minute ' : ' minutes ') + "and " + seconds + ((seconds === 1) ? ' second ' : ' seconds '))
                   
                  return;
                }
              } else {
                
                interaction.member.send("You are not able to sign up yet. Please wait " + minutes + ((minutes === 1) ? ' minute ' : ' minutes ') + "and " + seconds + ((seconds === 1) ? ' second ' : ' seconds '))
                  
                return;
              }
            } else {
              interaction.member.send("You are not able to sign up yet. Please wait " + seconds + ((seconds === 1) ? ' second ' : ' seconds '))
               
              return;
            }
          }
          

          
        } else {
          interaction.member.send("You do not have the required roles to signup")
        }
      } else if (interaction.customId === "removeRole") {
        const modal = new ModalBuilder()
            .setCustomId("removeRole")
            .setTitle("Remove Role");

        const roleInput = new TextInputBuilder()
          .setCustomId("roleID")
          .setLabel("Enter the ID of the role")
          .setStyle(TextInputStyle.Short)

        const firstActionRow = new ActionRowBuilder().addComponents(roleInput);
  
        modal.addComponents(firstActionRow);

        await interaction.showModal(modal);
      }
    }
})

client.login(process.env.TOKEN)